import Head from "next/head"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { auth, db } from "@/config/firebase.config"
import { FaBars } from 'react-icons/fa'
import { Dropdown, Menu, Modal, Input, Button, message } from 'antd';
import Image from "next/image"
import { AiOutlineUser } from "react-icons/ai"
import logo from "../../public/logo.png"
import { onAuthStateChanged, sendPasswordResetEmail } from "firebase/auth"
import { query, where, onSnapshot, collection, updateDoc, doc } from "firebase/firestore"
import { signOut } from "firebase/auth"
import { AiFillYoutube, AiOutlineWhatsApp } from "react-icons/ai"
import Footer from "@/components/footer"

export default function About() {
    const router = useRouter()
    const [userData, setUserData] = useState()
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAddressModalOpen, setAddressModalOpen] = useState(false)
    const [newAddress, setNewAddress] = useState(null)
    const [messageApi, contextHolder] = message.useMessage();



    async function getUserData() {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                const uid = user.uid;
                const whereQuery = where("uid", "==", uid)
                const q = query(collection(db, "users"), whereQuery);
                let docId = null
                const unsubscribe = onSnapshot(q, (querySnapshot) => {
                    const preUserData = [];
                    querySnapshot.forEach((doc) => {
                        docId = doc.id
                        preUserData.push(doc.data());
                    });
                    setUserData({ ...preUserData[0], id: docId })
                    // setUserData(preUserData[0])
                    setNewAddress(preUserData[0].address)
                })
            }
        });
    }

    async function handleAddressModalOk() {
        if (newAddress.length > 10) {
            messageApi.success({
                content: "Address updated",
            })
            setAddressModalOpen(false)
            let docRef = doc(db, "users", userData?.id)
            await updateDoc(docRef, {
                address: newAddress
            });
        } else {
            messageApi.error({
                content: "Invalid address"
            })
        }
    }

    const handleAddressModalCancel = () => {
        setAddressModalOpen(false)
    }


    const logout = () => {
        signOut(auth).then(() => {
            router.push("/about")
            // Sign-out successful.
        }).catch((error) => {
            // An error happened.
        });
    }

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
        setIsModalOpen(false)
    }

    const profileDropdownItems = (
        <Menu>
            {
                auth?.currentUser && <Menu.Item className='bg-gray-500 '>
                    <li className='text-white hover:text-gray-500'>
                        {userData?.firstName + userData?.lastName}
                    </li>
                </Menu.Item>
            }
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
            {
                auth?.currentUser && <Menu.Item>
                    <li onClick={() => setAddressModalOpen(true)}>Change address</li>
                </Menu.Item>
            }
            <Menu.Item key={3}>
                {
                    auth?.currentUser ? <li onClick={logout}>Logout</li> : <Link href={"/login"}>Login</Link>
                }
            </Menu.Item>
        </Menu>
    )

    const navbarDropdownItems = (
        <Menu>
            <Menu.Item className='w-[150px] border-b-2 hover:bg-gray-300' key={1}>
                <Link href={"/"}>Home</Link>
            </Menu.Item>
            <Menu.Item className='w-[150px] border-b-2 bg-[#94c755]' key={2}>
                <Link href={"/about"}>About</Link>
            </Menu.Item>
            <Menu.Item className='w-[150px] hover:bg-[#94c755]' key={3}>
                <Link href={"/contact"}>Contact</Link>
            </Menu.Item>
        </Menu>
    )
    useEffect(() => {
        getUserData()
    }, [])

    return (
        <>
            <Head>
                <title>
                    Sukoon Diabetic - About
                </title>
            </Head>
            {contextHolder}
            <main style={{ backgroundColor: "#fff", minHeight: "100vh" }}>
                <nav className="flex justify-between items-center px-3 border-b-2 border-[#94c755] bg-white fixed top-0 z-50 w-full">
                    <div>
                        <Link href={"/"}>
                            <Image src={logo} width={80} height={80} alt='Logo'></Image>
                        </Link>
                    </div>
                    <ul className="items-center gap-x-8 hidden md:flex">
                        <Link href={"/"} className='hover:border-b-2 border-[#94c755] hover:cursor-pointer'>Home</Link>
                        <Link href={"/about"} className='border-b-2 border-[#94c755] hover:cursor-pointer'>About</Link>
                        <Link href={"/contact"} className='hover:border-b-2 border-[#94c755] hover:cursor-pointer'>Contact</Link>
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
                <div className="w-[90%] lg:w-[80%] m-auto mt-20">
                    <dl>
                        <dt className="border-b-2 border-[#94c755] font-semibold w-fit px-2 mt-4 m-auto lg:m-0 my-2">
                            Who is Dr Jawed Firdous?
                        </dt>
                        <dd>
                            Dr. Jawed Firdous (DHMS, RHMP) is a qualified homeopathic doctor, registered with National Council for Homeopathy, Pakistan.
                            He has been practicing homeopathy since year 1986, and while he specializes in treatment of Daibetic related with kidney, stomach,
                            abdomen and heart, he has successfully treated many other types of complicated diseases, even such cases that are generally considered incurable.
                            He has special knack of treating vitiligo. He also offers homeopathic treatment at home.
                        </dd>
                    </dl>
                    <h2 className="font-semibold border-b border-[#94c755] w-fit px-2 mt-10">
                        Education
                    </h2>
                    <ul>
                        <li className="list-outside list-disc">National phath diploma in UK & Daibetic Training indo-Vietnam Medical Board in 2016.</li>
                        <li className="list-outside list-disc">
                            graduation From Karachi University in 1994
                        </li>
                    </ul>
                    <h1 className="font-semibold text-center text-xl py-2">
                        <abbr title="Doctor">Dr</abbr>
                        Jawed Firdous's most informative videos
                    </h1>
                    <div className="flex justify-center flex-wrap gap-5 my-5">
                        <div className="w-fit m-auto mt-6">
                            <h2 className="text-center font-semibold my-3 px-2 w-fit m-auto border-b border-[#94c755]">
                                Zindagi mai doctor se kese bachen?
                            </h2>
                            <iframe width="360" height="315" src="https://www.youtube.com/embed/rD9NYhUmqKc" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
                        </div>
                        <div className="w-fit m-auto mt-6">
                            <h2 className="text-center font-semibold my-3 px-2 w-fit m-auto border-b border-[#94c755]">
                                Sideffects of bodybuilding's medicine
                            </h2>
                            <iframe width="360" height="315" src="https://www.youtube.com/embed/SzxtN64zVNk" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
                        </div>
                        <div className="w-fit m-auto mt-6">
                            <h2 className="text-center font-semibold my-3 px-2 w-fit m-auto border-b border-[#94c755]">
                                Benefits of Tulsi plant
                            </h2>
                            <iframe width="360" height="315" src="https://www.youtube.com/embed/fjgMsDJiVHI" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
                        </div>
                        <div className="w-fit m-auto mt-6">
                            <h2 className="text-center font-semibold my-3 px-2 w-fit m-auto border-b border-[#94c755]">
                            How to get rid of joint pain?
                            </h2>
                            <iframe width="360" height="315" src="https://www.youtube.com/embed/SkFD7z3F2G0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
                        </div>
                        <div className="w-fit m-auto mt-6">
                            <h2 className="text-center font-semibold my-3 px-2 w-fit m-auto border-b border-[#94c755]">
                                Constipation treatment by Dr Jawed Firdous
                            </h2>
                            <iframe width="360" height="315" src="https://www.youtube.com/embed/8w73STN4DNQ" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
                        </div>
                        <div className="w-fit m-auto mt-6">
                            <h2 className="text-center font-semibold my-3 px-2 w-fit m-auto border-b border-[#94c755]">
                                Palm therapy treatment by Dr Jawed Firdous
                            </h2>
                            <iframe width="360" height="315" src="https://www.youtube.com/embed/hhtYDT8Ssqo" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
                        </div>
                        <div className="w-fit m-auto mt-6">
                            <h2 className="text-center font-semibold my-3 px-2 w-fit m-auto border-b border-[#94c755]">
                                Phsycosis problem and treatment by Dr Jawed Firdous
                            </h2>
                            <iframe width="360" height="315" className="m-auto" src="https://www.youtube.com/embed/uSm_tGwXIkg" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
                        </div>
                        <div className="w-fit m-auto mt-6">
                            <h2 className="text-center font-semibold my-3 px-2 w-fit m-auto border-b border-[#94c755]">
                                Apne ghusse aur khof pr kaise qabu payen
                            </h2>
                            <iframe width="360" height="315" className="m-auto" src="https://www.youtube.com/embed/XkYjqCHWe1A" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
                        </div>
                    </div>
                </div>
                <Footer />
            </main>

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
            </Modal>

            <Modal
                open={isAddressModalOpen}
                title="Update address"
                onOk={handleAddressModalOk}
                onCancel={handleAddressModalCancel}
                footer={[
                    <Button key="back" onClick={handleAddressModalCancel}>
                        Return
                    </Button>,
                    <Button
                        type="primary"
                        className='bg-[#94c755]'
                        // loading={loading}
                        onClick={handleAddressModalOk}
                    >
                        Update address
                    </Button>,
                ]}
            >
                <div className='mb-4'>
                    <Input
                        placeholder="Enter new address"
                        prefix={<AiOutlineUser className="site-form-item-icon outline-none" />}
                        onChange={(e) => setNewAddress(e.target.value)}
                        value={newAddress}
                    />
                </div>
            </Modal>
        </>
    )
}