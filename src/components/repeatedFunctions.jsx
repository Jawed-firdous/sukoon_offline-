import { Menu } from "antd";
import Link from "next/link";

function secureRandom() {
    const randomArray = new Uint32Array(1);
    window.crypto.getRandomValues(randomArray);
    return randomArray[0];
};
export { secureRandom }