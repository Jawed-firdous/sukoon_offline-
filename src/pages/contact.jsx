import axios from "axios";
import Head from "next/head";
import * as Yup from "yup"
import { useState } from "react";
import logo from "../../public/logo.png"
import { Menu } from "antd";
import Link from "next/link";
import { FaBars } from "react-icons/fa";
import { Dropdown } from "antd";
import { auth, db } from "@/config/firebase.config";
import { AiFillYoutube, AiOutlineUser } from "react-icons/ai";
import Image from "next/image";
import { signOut } from "firebase/auth";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { useRouter } from "next/router";
import { message as antdMessage, Modal, Button, Input } from "antd";
import Swal from "sweetalert2";

function ContactPage() {
    const [name, setName] = useState(null)
    const [email, setEmail] = useState(null)
    const [message, setMessage] = useState(null)
    const [errors, setErrors] = useState({})
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [messageApi, contextHolder] = antdMessage.useMessage();
    const [isSubmitting, setIsSubmitting] = useState(false)
    const router = useRouter()

    const showModal = () => {
        setIsModalOpen(true);
    };
    const handleOk = () => {

        sendPasswordResetEmail(auth, auth?.currentUser?.email)
            .then(() => {
                messageApi.open({
                    type: 'success',
                    content: 'Password reset link sent to your email address!',
                    duration: 2,
                });
                setIsModalOpen(false);
                // Password reset email sent!
                // ..
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                const msgToDisplay = errorCode.slice(5).split("-").join(" ").toUpperCase()
                messageApi.open({
                    type: 'error',
                    content: msgToDisplay,
                    duration: 2,
                });
                // ..
            });
    };
    const handleCancel = () => {
        setIsModalOpen(false);
    };

    const validationSchema = Yup.object().shape({
        name: Yup.string().required("Name is required").min(3),
        email: Yup.string().required("Email is required").email("Invalid email"),
        message: Yup.string().required("Message can't be empty").min(20, "Message is to too short")
    })

    function handleSubmit(event) {
        setIsSubmitting(true)
        event.preventDefault()
        validationSchema.validate({ name, email, message }, { abortEarly: false })
            .then((validatedValues) => {
                setErrors({})
                sendMessage()
            })
            .catch((err) => {
                setIsSubmitting(false)
                if (err instanceof Yup.ValidationError) {
                    const validationErrors = {};
                    err.inner.forEach((error) => {
                        validationErrors[error.path] = error.message;
                    });
                    setErrors(validationErrors);
                }
                console.error('Validation error:', err);
            });
    }

    async function sendMessage() {
        const docRef = await addDoc(collection(db, "user-messages"), {
            name: name,
            email: email,
            message: message,
            date: Timestamp.fromDate(new Date())
        });
        submitForm()
    }

    const submitForm = (e) => {
        axios.defaults.headers.post['Content-Type'] = 'application/json';
        axios.post('https://formsubmit.co/ajax/jawedfirdous@gmail.com', {
            subject: "User Response",
            name: name,
            email: email,
            message: message
        }).then(response => {
            setName("")
            setEmail("")
            setMessage("")
            messageApi.open({
                type: 'success',
                content: 'Your message was just sent!',
            });
            setIsSubmitting(false)
        })
           .catch((e) =>{
            setIsSubmitting(false)
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: `${e}`
                })
           })
    }


    const logout = () => {
        signOut(auth).then(() => {
            router.push("/contact")
            // Sign-out successful.
        }).catch((error) => {
            // An error happened.
        });
    }

    const navbarDropdownItems = (
        <Menu>
            <Menu.Item className='w-[150px] border-b-2 hover:bg-gray-300'>
                <Link href={"/"}>Home</Link>
            </Menu.Item>
            <Menu.Item className='w-[150px] border-b-2 hover:bg-[#94c755]'>
                <Link href={"/about"}>About</Link>
            </Menu.Item>
            <Menu.Item className='w-[150px] bg-[#94c755]'>
                <Link href={"/contact"}>Contact</Link>
            </Menu.Item>
        </Menu>
    )

    const profileDropdownItems = (
        <Menu>
            {/* {
                auth?.currentUser && <Menu.Item className='bg-gray-500 '>
                    <li className='text-white hover:text-gray-500'>
                        {userData?.firstName + userData?.lastName}
                    </li>
                </Menu.Item>
            } */}
            {
                auth?.currentUser && <Menu.Item key={1}>
                    <Link href={"/my-orders"}>My Orders</Link>
                </Menu.Item>
            }
            <Menu.Item key={2}>
                {
                    auth?.currentUser && <button onClick={showModal}>
                        Change password
                    </button>
                }
            </Menu.Item>
            <Menu.Item key={3}>
                {
                    auth?.currentUser ? <li onClick={logout}>Logout</li> : <Link href={"/login"}>Login</Link>
                }
            </Menu.Item>
        </Menu>
    )


    return (
        <>
        <Head>
            <title>SDC - Contact us</title>
        </Head>
            {contextHolder}
            <nav className="flex justify-between items-center px-3 border-b-2 border-[#94c755] fixed w-full bg-white z-10">
                <div>
                <Link href={"/"}>
                            <Image src={logo} width={80} height={80} alt='Logo'></Image>
                        </Link>                </div>
                <ul className="items-center gap-x-8 hidden md:flex">
                    <Link href={"/"} className='hover:border-b-2 border-[#94c755] hover:cursor-pointer'>Home</Link>
                    <Link href={"/about"} className='hover:border-b-2 border-[#94c755] hover:cursor-pointer'>About</Link>
                    <Link href={"/contact"} className='hover:border-b-2 border-[#94c755] hover:cursor-pointer border-b-2'>Contact</Link>
                </ul>
                <div className="flex gap-x-5 items-center">
                    <Dropdown
                        // menu={{
                        //   profileDropdownItems,
                        // }}
                        overlay={navbarDropdownItems}
                        placement="bottomRight"
                        arrow
                    >
                        <FaBars className="md:hidden text-lg" />
                    </Dropdown>
                    <Dropdown
                        // menu={{
                        //   profileDropdownItems,
                        // }}
                        overlay={profileDropdownItems}
                        placement="bottomRight"
                        arrow
                    >
                        <AiOutlineUser className='cursor-pointer text-[20px]' />
                    </Dropdown>
                </div>

            </nav>
            <section class="text-gray-600 body-font relative">
                <form class="container px-5 py-24 mx-auto" onSubmit={handleSubmit}>
                    <div class="flex flex-col text-center w-full mb-12">
                        <h1 class="sm:text-3xl text-2xl font-medium title-font mb-4 text-gray-900">Contact us</h1>
                        <p class="lg:w-2/3 mx-auto leading-relaxed text-base">Leave us a message, we will respond to you soon</p>
                    </div>
                    <div class="lg:w-1/2 md:w-2/3 mx-auto">
                        <div class="flex flex-wrap -m-2">
                            <div class="p-2 w-1/2">
                                <div class="relative">
                                    <label for="name" class="leading-7 text-sm text-gray-600">Name</label>
                                    <input value={name} type="text" id="name" name="name" class="w-full bg-gray-100 bg-opacity-50 rounded border border-gray-300 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out" onChange={(e) => setName(e.target.value)} />
                                </div>
                                <p className="text-center text-red-500">{
                                    errors.name && errors.name
                                }</p>
                            </div>
                            <div class="p-2 w-1/2">
                                <div class="relative">
                                    <label for="email" class="leading-7 text-sm text-gray-600">Email</label>
                                    <input value={email} type="email" id="email" name="email" class="w-full bg-gray-100 bg-opacity-50 rounded border border-gray-300 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out" onChange={(e) => setEmail(e.target.value)} />
                                </div>
                                <p className="text-center text-red-500">{
                                    errors.email && errors.email
                                }</p>
                            </div>
                            <div class="p-2 w-full">
                                <div class="relative">
                                    <label for="message" class="leading-7 text-sm text-gray-600">Message</label>
                                    <textarea value={message} id="message" name="message" class="w-full bg-gray-100 bg-opacity-50 rounded border border-gray-300 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 h-32 text-base outline-none text-gray-700 py-1 px-3 resize-none leading-6 transition-colors duration-200 ease-in-out" onChange={(e) => setMessage(e.target.value)}></textarea>
                                </div>
                                <p className="text-center text-red-500">{
                                    errors.message && errors.message
                                }</p>
                            </div>
                            <div class="p-2 w-full">
                                {!isSubmitting && <button type="submit" class="flex mx-auto text-white bg-[#94c755] border-0 py-2 px-8 focus:outline-none hover:bg-[#ade06e] rounded text-lg">Submit</button>}
                                {isSubmitting && <button type="button" class="flex mx-auto text-white bg-[#94c755] border-0 py-2 px-8 focus:outline-none hover:bg-[#ade06e] rounded text-lg">Submitting</button>}
                            </div>
                            <div class="p-2 w-full pt-8 mt-8 border-t border-gray-200 text-center">
                                <a class="text-indigo-500" href="mailto: sukoondiabeticcentre@gmail.com ">sukoondiabeticcentre@gmail.com</a>
                                <p class="leading-normal my-5">54/L, Block-2, Kashmir Road, P.E.C.H.S, Karachi 
                                    <br /> 
                                </p>
                                <span class="inline-flex">
                                    <a class="text-gray-500" href="https://www.facebook.com/SukoonDiabetesCentre" target="_blank">
                                        <svg fill="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" class="w-5 h-5" viewBox="0 0 24 24">
                                            <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"></path>
                                        </svg>
                                    </a>
                                    <a class="ml-4 text-gray-500">
                                        <svg fill="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" class="w-5 h-5" viewBox="0 0 24 24">
                                            <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"></path>
                                        </svg>
                                    </a>
                                    <a class="ml-4 text-gray-500">
                                        <svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" class="w-5 h-5" viewBox="0 0 24 24">
                                            <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                                            <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01"></path>
                                        </svg>
                                    </a>
                                    <a class="ml-4 text-gray-500">
                                        <svg fill="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" class="w-5 h-5" viewBox="0 0 24 24">
                                            <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"></path>
                                        </svg>
                                    </a>
                                    <a class="ml-4 text-gray-500" href="https://www.youtube.com/@sukoondiabetescentre1989/videos" target="_blank">
                                        <AiFillYoutube className="w-5 h-5" />
                                    </a>
                                </span>
                            </div>
                        </div>
                    </div>
                </form>
            </section>

            <Modal
                open={isModalOpen}
                title="Email"
                onOk={handleOk}
                onCancel={handleCancel}
                footer={[
                    <Button key="back" onClick={handleCancel}>
                        Return
                    </Button>,
                    <Button
                        type="primary"
                        className='bg-[#94c755]'
                        // loading={loading}
                        onClick={handleOk}
                    >
                        Send password reset link
                    </Button>,
                ]}
            >
                <div className='mb-4'>
                    <Input
                        placeholder="Enter your email"
                        prefix={<AiOutlineUser className="site-form-item-icon outline-none" />}
                        value={auth?.currentUser?.email}
                    />
                </div>
                {/* <Input.Password
            prefix={<AiOutlineKey />}
            placeholder="input password"
            iconRender={(visible) => (visible ? <AiTwotoneEye /> : <AiOutlineEyeInvisible />)}
          /> */}
            </Modal>

        </>
    )
}

export default ContactPage