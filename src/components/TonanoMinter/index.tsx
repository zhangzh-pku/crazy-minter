"use client";

import React, { useCallback, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Button from "../ui/Button";
import TonWeb from "tonweb";
import { mnemonicToKeyPair } from "tonweb-mnemonic";

const Minter: React.FC = () => {
  const [privs, setPrivs] = useState<string>("");
  const [isEnd, setIsEnd] = useState<boolean>(false);
  const isEndRef = useRef<boolean>(false);
  isEndRef.current = isEnd;
  const [logs, setLogs] = useState<string[]>([]);
  const [isView, setIsView] = useState<boolean>(true);
  const [count, setCount] = useState<number>(0);

  const walletMint = useCallback(async (priv: string, idx: number) => {
    const BN = TonWeb.utils.BN;
    const tonweb = new TonWeb(
      new TonWeb.HttpProvider("https://mainnet.tonhubapi.com/jsonRPC")
    );
    const privs = priv.split(" ");
    console.log(privs);
    const keyPair = await mnemonicToKeyPair(privs);
    const WalletClass = tonweb.wallet.all["v4R2"];
    const wallet = new WalletClass(tonweb.provider, {
      publicKey: keyPair.publicKey,
      wc: 0,
    });
    const address = await wallet.getAddress();
    const nonBounceableAddress = address.toString(true, true, false);
    while (true) {
      if (isEndRef.current) {
        setLogs((pre) => [...pre, `暂停铸造：${nonBounceableAddress}`]);
        break;
      }
      let seqno = (await wallet.methods.seqno().call()) || 0;
      wallet.methods
        .transfer({
          secretKey: keyPair.secretKey,
          toAddress: address,
          amount: new BN(0),
          payload:
            'data:application/json,{"p":"ton-20","op":"mint","tick":"nano","amt":"100000000000"}',
          sendMode: 3,
          seqno: seqno,
        })
        .send()
        .then((result) => {
          console.log(result);
          setLogs((pre) => [...pre, `铸造成功：${nonBounceableAddress} index: ${idx}`]);
        })
        .catch((err) => {
          console.log(err);
          setLogs((pre) => [...pre, `铸造失败：${nonBounceableAddress}`]);
        });
    }
  }, []);

  const handleMint = async () => {
    setIsEnd(false);
    setLogs((pre) => [...pre, `开始铸造`]);

    // 验证助记词
    if (!privs) {
      setLogs((pre) => [...pre, `请输入助记词`]);
      return;
    }
    const privsList = privs.split(";");

    for (let i = 0; i < privsList.length; i++) {
      walletMint(privsList[i], i);
    }
  };

  const handleEnd = () => {
    setIsEnd(true);
    isEndRef.current = true;
  };

  return (
    <div className="flex flex-col items-center">
      <h1>Tonano Inscription疯狂铸造脚本</h1>
      <p className="text-xs mt-2 text-gray-400">打到账户没钱为止</p>
      <div className="text-xs w-[400px] mt-6">
        <span>项目方推特：</span>
        <Link
          className="underline"
          target="_blank"
          href="https://twitter.com/Ton_scription"
        >
          https://twitter.com/Ton_scription
        </Link>
      </div>
      <div className="text-xs w-[400px] mt-2">
        <span>项目网址：</span>
        <Link className="underline" target="_blank" href="https://tonano.io/">
          https://tonano.io/
        </Link>
      </div>
      <div className="flex flex-col mt-6">
        <span
          className="text-xs rounded-md flex w-6 h-6 justify-center items-center cursor-pointer hover:bg-gray-100"
          onClick={() => {
            setIsView((pre) => !pre);
          }}
        >
          {isView ? (
            <Image src="/icons/eye.svg" width={16} height={16} alt="visible" />
          ) : (
            <Image
              src="/icons/eye-slash.svg"
              width={16}
              height={16}
              alt="visible"
            />
          )}
        </span>
        <textarea
          className="mt-2 border border-black rounded-xl w-[400px] px-4 py-4 resize-none h-[220px]"
          placeholder="请输入助记词，比如：jazz bench loan chronic ready pelican travel charge lunar pear detect couch。当有多的账号的时候，用;分割，比如:jazz bench loan chronic ready pelican travel charge lunar pear detect couch;black clay figure average spoil insane hire typical surge still brown object"
          value={isView ? privs : !privs ? "" : "*************************"}
          onChange={(e) => setPrivs(e.target.value)}
        />
      </div>
      <div className="flex w-[400px] justify-center space-x-6 mt-4">
        <Button
          text="开始铸造"
          theme="primary"
          className="border w-[150px] border-black px-4 py-2 rounded-full"
          onClick={handleMint}
        />
        <Button
          text="暂停"
          theme="outline"
          className="border w-[150px] border-black px-4 py-2 rounded-full"
          onClick={handleEnd}
        />
      </div>

      <span className="mt-6 w-[400px] text-left font-bold text-lg">{`日志(本次已铸造+${count})`}</span>
      <p className="text-xs text-left w-[400px]  mt-2 mb-2 text-gray-400">
        一开始连接比较慢，铸造失败不扣币。
      </p>
      <div className="px-4 py-2 whitespace-pre border border-black w-[400px] h-[400px] overflow-auto">
        {logs.join("\n")}
      </div>
    </div>
  );
};

export default Minter;
