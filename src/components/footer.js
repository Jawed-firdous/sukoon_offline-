import Image from "next/image"
import { AiFillYoutube, AiOutlineWhatsApp } from "react-icons/ai"
import logo from "../../public/logo.png"
import Link from "next/link"
import { AiFillPhone } from "react-icons/ai"
import { FiMail } from "react-icons/fi"

const Footer = () => {
    return (
        <footer class="text-gray-600 body-font border-t border-[#94c755] bg-transparent pb-4">
            <div class="container px-5 py-8 mx-auto flex items-center sm:flex-row flex-col">
                <a class="flex title-font font-medium items-center md:justify-start justify-center text-gray-900">
                <Link href={"/"}>
                            <Image src={logo} width={80} height={80} alt='Logo'></Image>
                        </Link>
                    <span class="ml-3 text-xl">Sukoon Diabetic Centre</span>
                </a>
                <p class="text-sm text-gray-500 sm:ml-4 sm:pl-4 sm:border-l-2 sm:border-gray-200 sm:py-2 sm:mt-0 mt-4">© Copyright
                    {/* <a href="https://twitter.com/knyttneve" class="text-gray-600 ml-1" rel="noopener noreferrer" target="_blank">@knyttneve</a> */}
                </p>
                <span class="inline-flex items-center sm:ml-auto sm:mt-0 mt-4 justify-center sm:justify-start">
                    <a class="text-gray-500" href="https://www.facebook.com/SukoonDiabetesCentre" target="_blank">
                        <svg fill="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" class="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"></path>
                        </svg>
                    </a>
                    <a class="ml-3 text-gray-500" href="https://www.youtube.com/@sukoondiabetescentre1989/videos" target="_blank">
                        <AiFillYoutube className="text-[28px]" />
                    </a>
                    <a class="ml-3 text-gray-500" href="https://wa.me/+923322418007" target="_blank">
                        <AiOutlineWhatsApp className="text-[28px]" />
                    </a>
                </span>
            </div>
                    <address className="text-center">
                        Designed by Muhammad Taha Hussain
                        <span className="flex justify-center">
                           <a href="mailto:hussaintaha620@gmail.com" className="flex items-center gap-x-1">
                           <FiMail className="text-[25px] inline"/>
                            hussaintaha620@gmail.com
                           </a>
                        </span>
                        <span className="flex justify-center">
                           <a href="tel:+923121165005" className="flex items-center">
                           <AiFillPhone className="text-[25px] inline"/>
                           +923121165005
                           </a>
                        </span>
                    </address>
        </footer>
    )
}

export default Footer