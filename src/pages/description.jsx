import { useRef } from 'react';
import React from "react";
import axios from "axios";
import { doc, getDoc, where, query, collection, onSnapshot, addDoc, Timestamp, updateDoc } from "firebase/firestore"
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { db } from "@/config/firebase.config";
import { Carousel } from "antd";
import logo from "../../public/logo.png"
import Link from "next/link";
import Image from "next/image";
import { Menu, Dropdown, message, notification, Modal, Button, Input } from "antd";
import { auth } from "@/config/firebase.config";
import { FiShoppingCart } from "react-icons/fi";
import { FaBars, FaFacebook, FaYoutube, FaWhatsapp } from "react-icons/fa";
import { EmailAuthProvider, reauthenticateWithCredential, onAuthStateChanged, getIdToken } from "firebase/auth";
import { AiOutlineUser, AiOutlinePlus, AiOutlineMinus, AiOutlineKey, AiOutlineEyeInvisible, AiTwotoneEye, AiOutlineFacebook } from "react-icons/ai";
import { HiX } from "react-icons/hi";
import { CgProfile } from "react-icons/cg";
import Head from "next/head";
import { sendPasswordResetEmail } from "firebase/auth";
import Rating from "react-rating";
import { AiFillStar, AiOutlineStar } from "react-icons/ai"
import { secureRandom } from "@/components/repeatedFunctions";
import Footer from "@/components/footer";
import { signOut } from "firebase/auth";

function DescriptionPage() {
    const router = useRouter()
    // const productId = router.query?.productId;
    const [productId, setProductId] = useState(null)
    const [data, setData] = useState([])
    const [showCart, setShowCart] = useState(false)
    const [total, setTotal] = useState(0);
    const [messageApi, contextHolder] = message.useMessage();
    const [api, notifictionContextHolder] = notification.useNotification();
    const [cart, setCart] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [oldPassword, setOldPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [userData, setUserData] = useState()
    const [isAddressModalOpen, setAddressModalOpen] = useState(false)
    const [newAddress, setNewAddress] = useState(null)
    const [email, setEmail] = useState(auth?.currentUser?.email)
                

    // New JS 
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
            // Sign-out successful.
            router.replace(window.location.href)
        }).catch((error) => {
            // An error happened.
        });
    }

    const orderIdGenerator = () => {
        const randomArray = new Uint32Array(1);
        window.crypto.getRandomValues(randomArray);
        return randomArray[0];
    };

    const submitForm = (e) => {
        axios.defaults.headers.post['Content-Type'] = 'application/json';
        axios.post('https://formsubmit.co/ajax/jawedfirdous@gmail.com', {
            subject: "New order",
            name: userData?.firstName + userData?.lastName,
            message: `Hello ${userData?.firstName + userData?.lastName} ordered something from your mart, Go! check it out...`
        }).then(response => console.log(response))
            .catch(error => console.log(error));
    }

    async function submitOrder() {
        if (!auth.currentUser) {
            return router.push('/login')
        }
        try {
            const docRef = await addDoc(collection(db, "orders"), {
                totalItems: cart,
                totalPrice: total,
                status: "active",
                uid: auth?.currentUser?.uid,
                date: Timestamp.fromDate(new Date()),
                name: userData?.firstName + userData?.lastName,
                phoneNumber: userData?.phNo,
                orderId: secureRandom(),
                address: userData?.address
            });
            submitForm()
            openNotification('topLeft')
        } catch (e) {

        }

    }


    const Context = React.createContext({
        name: 'Default',
    });


    const openNotification = (placement) => {
        api.info({
            message: `Order submitted`,
            description: <Context.Consumer>{({ name }) => `Hello, ${userData?.firstName + userData?.lastName} your order is just submitted.`}</Context.Consumer>,
            placement,
        });
        setCart([])
        setTotal(0)
        localStorage.clear()
    };

    async function submitOrder() {
        if (!auth.currentUser) {
            return router.push('/login')
        }
        try {
            const docRef = await addDoc(collection(db, "orders"), {
                totalItems: cart,
                totalPrice: total,
                status: "active",
                uid: auth?.currentUser?.uid,
                date: Timestamp.fromDate(new Date()),
                name: userData?.firstName + userData?.lastName,
                phoneNumber: userData?.phNo,
                orderId: secureRandom(),
                address: userData?.address
            });
            setShowCart(!showCart)
            submitForm()
            openNotification('topLeft')
        } catch (e) {
        }

    }
    const removedfromCart = () => {
        messageApi.open({
            type: "info",
            content: "Item removed from cart"
        })
    }

    function removeFromCart(id) {
        let index = cart.findIndex(val => val.id === id)
        cart.splice(index, 1)
        localStorage.setItem("cart", JSON.stringify(cart))
        calculatePrice()
        removedfromCart()
    }

    function calculatePrice() {
        if (!cart.length > 0) {
            let preCart = JSON.parse(localStorage.getItem("cart"))
            const sum = preCart.reduce((acc, curr) => {
                return acc + (curr.price * curr.qty);
            }, 0);
            setTotal(sum)
        } else {
            const sum = cart.reduce((acc, curr) => {
                return acc + (curr.price * curr.qty);
            }, 0);
            setTotal(sum)
        }
    }

    const addedToCart = () => {
        messageApi.open({
            type: 'success',
            content: 'Item added to cart',
        });
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
            <Menu.Item className='w-[150px] border-b-2 hover:bg-gray-300'>
                <Link href={"/"}>Home</Link>
            </Menu.Item>
            <Menu.Item className='w-[150px] border-b-2 hover:bg-gray-300'>
                <Link href={"/about"}>About</Link>
            </Menu.Item>
            <Menu.Item className='w-[150px] border-b-2 hover:bg-gray-300'>
                <Link href={"/contact"}>Contact</Link>
            </Menu.Item>
        </Menu>
    )

    // Old Javascript 

    const contentStyle = {
        margin: 0,
        height: '160px',
        color: '#fff',
        lineHeight: '160px',
        textAlign: 'center',
        background: '#364d79',
    };
    // const [cart, setCart] = useState([
    // {
    //   id: "QlDQozO58hQw19h4Ckq1",
    //   qty: 1
    // }
    // ])

    async function getData() {
        if (productId) {
            const docRef = doc(db, "products", productId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setData(docSnap.data())
            } else {
                // doc.data() will be undefined in this case
            }
        } else {
            alert("There is an error while getting the query")
        }
    }

    const updateProductInLocalStorage = async () => {
        const semiCart = JSON.parse(localStorage.getItem("cart")) || []
        if (semiCart.length > 0) {
            let finalCart = []
            for (let i = 0; i < semiCart.length; i++) {
                let targatedProduct = semiCart.find((item) => item.id == semiCart[i].id)
                if (targatedProduct) {
                    const ref = doc(db, "products", targatedProduct.id)
                    const docSnap = await getDoc(ref);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        finalCart.push({
                            ...data,
                            id: docSnap.id,
                            qty: semiCart[i].qty
                        })

                    } else {
                        semiCart.splice(i, 1)
                    }
                }
                setCart(finalCart)
                localStorage.setItem("cart", JSON.stringify(finalCart))
                calculatePrice()
            }
        }
    }

    // function cartPersistor() {
    // let value = localStorage.getItem("cart")
    // if (value == null) {
    //     localStorage.setItem("cart", JSON.stringify(cart))
    // } else if (value !== null) {
    //     setCart(JSON.parse(value))
    // }
    // }

    function addToCart(id, condition) {
        let found = false;

        for (let i = 0; i < cart.length; i++) {
            if (cart[i].id === productId) {
                found = true;
                condition == "plus" ? cart[i].qty++ : cart[i].qty > 1 && cart[i].qty--
                break;
            }
        }

        if (!found) {
            cart.push({
                id: productId,
                name: data?.name,
                description: data?.description,
                price: data?.price,
                qty: 1
            });
            addedToCart()
        }
        localStorage.setItem("cart", JSON.stringify(cart))
        calculatePrice()
        getData()
    }

    function checkIdExists(id) {
        let exists = false
        for (let i = 0; i < cart.length; i++) {
            if (cart[i].id == id) {
                exists = true
            }
        }
        if (exists == true) {
            return true;
        } else {
            return false;
        }
    }

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
    useEffect(() => {
        if (router.query.productId) {
            setProductId(router.query.productId);
        }
    }, [router.query.productId]);

    useEffect(() => {
        if (productId !== null) {
            getData();
        }
    }, [productId]);


    useEffect(() => {
        getUserData()
        updateProductInLocalStorage()

    },

              [])

    return (
        <>
            <Head>
                <title>{data?.name}</title>
                <link rel="stylesheet" href="../styles/description-slider.css" />
            </Head>
            {contextHolder}
            {notifictionContextHolder}
            <nav className="flex justify-between items-center px-3 border-b-2 border-[#94c755] bg-white fixed top-0 z-50 w-full">
                <div>
                <Link href={"/"}>
                            <Image src={logo} width={80} height={80} alt='Logo'></Image>
                        </Link>                </div>
                <ul className="items-center gap-x-8 hidden md:flex">
                    <Link href={"/"} className='hover:border-b-2 border-[#94c755] hover:cursor-pointer'>Home</Link>
                    <Link href={"/about"} className='hover:border-b-2 border-[#94c755] hover:cursor-pointer'>About</Link>
                    <Link href={"/contact"} className='hover:border-b-2 border-[#94c755] hover:cursor-pointer'>Contact</Link>
                </ul>
                <div className="flex gap-x-5 items-center">
                    <span className='flex p-1 rounded-2'>
                        <FiShoppingCart className="cursor-pointer" onClick={() => setShowCart(!showCart)} />
                        <span className='text-sm'>
                            {cart?.length}
                        </span>
                    </span>
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
            {
                !showCart && <div class="min-w-screen min-h-screen bg-[#94c755] items-center p-5 lg:p-10 overflow-hidden relative mt-10">
                    <div class="w-full max-w-6xl rounded bg-white shadow-xl p-3 lg:p-20 mx-auto text-gray-800 relative md:text-left mt-14">
                        <div class="md:flex items-center -mx-10">
                            <div class="w-full md:w-1/2 px-10 mb-10 md:mb-0 md:border-r border-[#2e302c]">
                                <div class="border bg-[#2e302c]" >
                                    <Carousel className="border description-carousel">
                                        {data?.embedLink?.length > 10 && <div>
                                            <iframe src={data?.embedLink} title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen className="w-full h-64 "></iframe>
                                        </div>}
                                        {
                                            data?.images?.map((val, index) => {
                                                return (
                                                    // className="unique-div !min-h-[240px] !flex !justify-center !items-center"
                                                    // <div>
                                                    <div key={index} className="unique-div !min-h-[240px] !flex !justify-center !items-center">
                                                        <img src={val?.url} alt="" className='m-auto h-[256px]' />
                                                    </div>
                                                    
                                                    // </div>
                                                )
                                            })
                                        }
                                    </Carousel>
                                </div>
                            </div>
                            <div class="w-full md:w-1/2 px-10">
                                <div class="mb-10">
                                    <h1 class="font-bold uppercase text-2xl mb-5">{data?.name}</h1>
                                    <p class="text-sm whitespace-pre-wrap">{data?.description}</p>
                                </div>

                                <div className="flex justify-center gap-x-3 items-center">
                                    <div>
                                        <span>Rs</span>
                                        <span className="font-bold price-tag">{data?.price}/-</span>
                                    </div>
                                    <button className="bg-[#94c755] text-white px-3 py-2 rounded"> {
                                        checkIdExists(productId) ? "Added to cart" : <span onClick={() => addToCart(productId, "plus")}>Add to cart</span>
                                    }</button>
                                </div>

                                <div className="flex justify-center gap-3 relative top-2 md:top-4 py-5 lg:top-6">
                                    <a class="text-gray-500" href="https://www.facebook.com/SukoonDiabetesCentre" target="_blank">
                                        <FaFacebook />
                                    </a>
                                    <a class="ml-3 text-gray-500" href="https://www.youtube.com/@sukoondiabetescentre1989/videos" target="_blank">
                                        <FaYoutube />
                                    </a>
                                    
                                   <a class="ml-3 text-gray-500" href={`https://wa.me/+923322418007?text=https://sukoondiabeticcentre.com${router?.asPath}`} target="_blank">
                                        <FaWhatsapp />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            }
            {
                data?.reviews &&
                <div className="min-w-screen bg-[#94c755] items-center p-5 lg:p-10 overflow-hidden relative">
                    {/* <div className="min-w-screen bg-[#94c755] items-center overflow-hidden relative"> */}
                    <div class="w-full max-w-6xl rounded bg-white shadow-xl p-3 lg:p-10 mx-auto text-gray-800 relative md:text-left mb-10">
                        {/* <div class="w-full max-w-6xl rounded bg-white shadow-xl p-3 lg:p-10 mx-auto text-gray-800 relative md:text-left mb-10"> */}
                        <h1 className="w-fit m-auto relative lg:-top-5 font-bold border-b-2 border-[#94c755] px-2"> Rating & reviews</h1>
                        <div className="flex flex-col sm:flex-row gap-5 flex-wrap justify-center mt-4">
                            {
                                data?.reviews?.map((val, index) => {
                                    return (
                                        <div className="border-b-2 py-4 w-[320px]" key={index
                                        }>
                                            <div className="flex items-center gap-x-2">
                                                <div><CgProfile className="text-[50px]" /></div>
                                                <div className="text-left">
                                                    <p>{val?.name}</p>
                                                    <div> <Rating fullSymbol={<AiFillStar color="rgb(159 88 10 / var(--tw-text-opacity))" />} emptySymbol={<AiOutlineStar />} initialRating={val?.stars} readonly={true} /> </div>
                                                </div>
                                            </div>
                                            <p className="ml-2 py-2">
                                                {
                                                    val?.message
                                                }
                                            </p>
                                        </div>
                                    )
                                })
                            }
                        </div>
                    </div>
                </div>
            }
            {
                showCart && <section class="antialiased bg-gray-100 z-10 text-gray-600 h-screen px-4 absolute top-0 left-0 right-0" x-data="app">
                    <div class="flex flex-col justify-center h-full">
                        {/* <!-- Table --> */}
                        <div class="w-full max-w-2xl mx-auto bg-white shadow-lg rounded-sm border border-gray-200">
                            <header class="px-5 py-4 border-b border-gray-100 flex justify-between w-full">
                                <div class="font-semibold text-gray-800">Manage Cart</div>
                                <div className='text-xl font-bold cursor-pointer' onClick={() => setShowCart(!showCart)}>
                                    X
                                </div>
                            </header>

                            <div class="overflow-x-auto p-3">
                                <table class="table-auto w-full">
                                    {
                                        cart?.length > 0 && <thead class="text-xs font-semibold uppercase text-gray-400 bg-gray-50">
                                            <tr>
                                                <th class="p-2">
                                                    <div class="font-semibold text-left">Product Name</div>
                                                </th>
                                                <th class="p-2">
                                                    <div class="font-semibold text-left">Quantity</div>
                                                </th>
                                                <th class="p-2">
                                                    <div class="font-semibold text-left">Actions</div>
                                                </th>
                                                <th class="p-2">
                                                    <div class="font-semibold text-left">Total</div>
                                                </th>
                                                <th class="p-2">
                                                    <div class="font-semibold text-center">Remove</div>
                                                </th>
                                            </tr>
                                        </thead>

                                    }
                                    <tbody class="text-sm divide-y divide-gray-100">
                                        {/* <!-- record 1 --> */}
                                        {
                                            cart?.length > 0 && cart?.map((val, index) => {
                                                return (
                                                    <tr key={index}>
                                                        <td class="p-2">
                                                            <div class="font-medium text-gray-800">
                                                                {val?.name}
                                                            </div>
                                                        </td>
                                                        <td class="p-2">
                                                            <div class="text-left">{val?.qty}</div>
                                                        </td>
                                                        <td class="p-2">
                                                            <div className="flex w-[50%] justify-between">
                                                                <div>
                                                                    <AiOutlinePlus onClick={() => addToCart(val, "plus")} className="cursor-pointer" />
                                                                </div>
                                                                <div><AiOutlineMinus onClick={() => addToCart(val, "minus")} className="cursor-pointer" /></div>
                                                            </div>
                                                        </td>
                                                        <td class="p-2">
                                                            <div class="text-left font-medium text-green-500">
                                                                RS {val?.price}
                                                            </div>
                                                        </td>
                                                        <td class="p-2">
                                                            <div class="flex justify-center">
                                                                <button onClick={() => removeFromCart(val.id)}>
                                                                    <svg class="w-8 h-8 hover:text-blue-600 rounded-full hover:bg-gray-100 p-1"
                                                                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                                                        xmlns="http://www.w3.org/2000/svg">
                                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16">
                                                                        </path>
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            })
                                        }
                                        {
                                            !cart?.length && <p className='text-center'>Your cart is empty</p>
                                        }
                                    </tbody>
                                </table>
                            </div>

                            {/* <!-- total amount --> */}
                            <div className='flex items-center justify-between flex-row-reverse'>
                                <div>
                                    {
                                        cart?.length > 0 && <button className='bg-[#94c755] p-1 rounded mr-3 text-gray-100' onClick={submitOrder}>Proceed to checkout</button>
                                    }
                                </div>
                                <div class="flex justify-end font-bold space-x-4 text-2xl border-t border-gray-100 px-5 py-4">
                                    <div>Total</div>
                                    <div class="text-[#94c755]">{total} <span x-text="total.toFixed(2)"></span></div>
                                </div>
                            </div>

                            <div class="flex justify-end">
                                {/* <!-- send this data to backend (note: use class 'hidden' to hide this input) --> */}
                                <input type="hidden" class="border border-black bg-gray-50" x-model="selected" />
                            </div>
                        </div>
                    </div>
                </section>
            }

            <Footer />

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
                        Update password
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

export default DescriptionPage
