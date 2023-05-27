import Head from 'next/head'
import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FiShoppingCart } from "react-icons/fi"
import { useState, useMemo } from 'react'
import logo from "../../public/logo.png"
import { auth, db } from '@/config/firebase.config'
import { onSnapshot, query, collection, addDoc, where, Timestamp, orderBy, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { AiOutlineCheckCircle, AiOutlinePlus, AiOutlineMinus, AiOutlineUser, AiOutlineEyeInvisible, AiTwotoneEye, AiOutlineKey } from "react-icons/ai"
import { useRef } from 'react'
import { Carousel } from 'antd'
import { Button, message, Divider, notification, Space, Dropdown, Menu, Modal, Input } from 'antd';
import { signOut, onAuthStateChanged, sendPasswordResetEmail } from "firebase/auth";
import axios from 'axios'
import { HiX } from 'react-icons/hi'
import { FaBars } from 'react-icons/fa'
import { secureRandom } from '@/components/repeatedFunctions'
import Rating from 'react-rating'
import { AiFillStar, AiOutlineStar } from "react-icons/ai"
import Footer from '@/components/footer'

export default function MyOrders() {
    const [rating, setRating] = useState(0);
    const [showCart, setShowCart] = useState(false)
    const [orders, setOrders] = useState([])
    const [cart, setCart] = useState([])
    const [api, notifictionContextHolder] = notification.useNotification();
    const [total, setTotal] = useState(0);
    const [cartChange, setCartChange] = useState(false)
    const [messageApi, contextHolder] = message.useMessage();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userData, setUserData] = useState()
    const ownerPhoneNumber = "03022418007"
    const [modal2Open, setModal2Open] = useState(false);
    const [reviewMsg, setReviewMsg] = useState()
    const [submitReviewRef, setSubmitReviewRef] = useState(null)
    const [isAddressModalOpen, setAddressModalOpen] = useState(false)
    const [newAddress, setNewAddress] = useState(null)
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


    const addedToCart = () => {
        messageApi.open({
            type: 'success',
            content: 'Item added to cart',
        });
    }

    const removedfromCart = () => {
        messageApi.open({
            type: "info",
            content: "Item removed from cart"
        })
    }

    // const whereQuery = (where("status", "==", "active"), where("uid", "==", uid))
    // const q = query(collection(db, "orders"), whereQuery);


    async function fetchOrders() {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                const uid = user.uid;
                const whereQuery = (where("uid", "==", uid))
                let ordering = orderBy("date", "desc")
                const q = query(collection(db, "orders"), ordering, whereQuery);
                const unsubscribe = onSnapshot(q, (querySnapshot) => {
                    const preOrders = [];
                    querySnapshot.forEach((doc) => {
                        preOrders.push(doc.data());
                    });
                    setOrders(preOrders)
                })
                // ...
            } else {
                router.push("/")
            }
        });
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

    function cartPersistor() {
        let value = localStorage.getItem("cart")
        if (value == null) {
            localStorage.setItem("cart", JSON.stringify(cart))
        } else if (value !== null) {
            setCart(JSON.parse(value))
        }
    }

    function addToCart(val, condition) {
        let index = cart.findIndex((thisVal) => thisVal.id == val.id)
        if (index >= 0) {
            condition == "plus" ? cart[index].qty++ : cart[index].qty > 1 && cart[index].qty--
        } else {
            cart.push({
                id: val?.id,
                name: val?.data?.name,
                description: val?.data?.description,
                price: val?.data?.price,
                qty: 1
            });
            addedToCart()
        }
        localStorage.setItem("cart", JSON.stringify(cart))
        calculatePrice()
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
            console.error("Error adding document: ", e);
        }

    }

    const submitForm = (e) => {
        axios.defaults.headers.post['Content-Type'] = 'application/json';
        axios.post('https://formsubmit.co/ajax/jawedfirdous@gmail.com', {
            subject: "New order",
            name: `${userData?.firstName} ${userData?.lastName}`,
            message: `Hello ${userData?.firstName + userData?.lastName} ordered something from your mart, Go! check it out...`
        }).then(response => console.log(response))
            .catch(error => console.log(error));
    }

    const logout = () => {
        signOut(auth).then(() => {
            // Sign-out successful.
        }).catch((error) => {
            // An error happened.
        });
    }


    function open2Modal(val) {
        setSubmitReviewRef(val.orderId)
        setModal2Open(true)
    }

    async function submitReview() {
        const q = query(collection(db, "orders"), where("orderId", "==", submitReviewRef));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(async (docData) => {
            // doc.data() is never undefined for query doc snapshots
            const data = docData.data()
            for (let i = 0; i < data?.totalItems.length; i++) {
                let docRef2 = doc(db, "products", data?.totalItems[i].id)
                const docSnap = await getDoc(docRef2);

                if (docSnap.exists()) {
                    let reviewsArray = []
                    if (docSnap.data().reviews) {
                        reviewsArray = docSnap.data().reviews
                    }
                    reviewsArray.push({
                        name: `${userData?.firstName} ${userData?.lastName}`,
                        email: userData?.email,
                        message: reviewMsg,
                        stars: rating
                    })
                    await updateDoc(docRef2, {
                        reviews: reviewsArray
                    });
                    setReviewMsg()
                    setRating(0)
                } else {
                    // docSnap.data() will be undefined in this case
                }

            }
            await updateDoc(doc(db, "orders", docData.id), {
                rated: true
            });

        });
        setSubmitReviewRef('Done')
        setModal2Open(false)
    }

    // ANTD Configuration 

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


    const contentStyle = {
        margin: 0,
        height: '160px',
        color: '#fff',
        lineHeight: '160px',
        textAlign: 'center',
        background: '#364d79',
    };
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

    const contextValue = useMemo(
        () => ({
            name: 'Ant Design',
        }),
        [],
    );


    useEffect(() => {
        fetchOrders()
        cartPersistor()
        getUserData()
    }, [])

    useEffect(() => {
        calculatePrice()
    }, [cartChange])

    return (
        <>
            {contextHolder}
            {notifictionContextHolder}
            <Head>
                <title>Sukoon Diabetic - My Orders</title>
            </Head>
            <main>

                <nav className="flex justify-between items-center px-3 border-b-2 border-[#94c755] fixed w-full z-10 bg-white">
                    <div>
                        <Link href={"/"}>
                            <Image src={logo} width={80} height={80} alt='Logo'></Image>
                        </Link>
                    </div>
                    <ul className="items-center gap-x-8 hidden md:flex">
                        <Link href={"/"} className='hover:border-b-2 border-[#94c755] hover:cursor-pointer'>Home</Link>
                        <Link href={"/about"} className='hover:border-b-2 border-[#94c755] hover:cursor-pointer'>About</Link>
                        <Link href={"/contact"} className='hover:border-b-2 border-[#94c755] hover:cursor-pointer'>Contact</Link>                    </ul>
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

                {/* Navbar Ends  */}

                {/* Table Starts  */}

                <table class="border-collapse w-full relative top-14 mb-14 min-h-screen">
                    { orders?.length > 0 && <thead>
                        <tr>
                            <th class="p-3 font-bold uppercase bg-gray-200 text-gray-600 border border-gray-300 hidden lg:table-cell">Order Id</th>
                            <th class="p-3 font-bold uppercase bg-gray-200 text-gray-600 border border-gray-300 hidden lg:table-cell">Status</th>
                            <th class="p-3 font-bold uppercase bg-gray-200 text-gray-600 border border-gray-300 hidden lg:table-cell">Total</th>
                            <th class="p-3 font-bold uppercase bg-gray-200 text-gray-600 border border-gray-300 hidden lg:table-cell">Details</th>
                            <th class="p-3 font-bold uppercase bg-gray-200 text-gray-600 border border-gray-300 hidden lg:table-cell"> Inquiry Number </th>
                        </tr>
                    </thead>}
                    <tbody>
                        {
                            orders?.length > 0 ?  orders?.map((val, index) => {
                                return (
                                    <tr key={index} class="bg-white lg:hover:bg-gray-100 flex lg:table-row flex-row lg:flex-row flex-wrap lg:flex-no-wrap mb-10 lg:mb-0">
                                        <td class="w-full lg:w-auto bg-gray-500 p-3 text-white text-center border border-b block lg:table-cell relative lg:static">
                                            <span class="lg:hidden absolute top-0 left-0 bg-blue-200 px-2 py-1 text-xs font-bold uppercase">Order Id</span>
                                            <span className='font-semibold'>#{val?.orderId}</span>
                                            {/* val?.date?.toDate().toString().slice(0, -23) */}
                                        </td>
                                        <td class="w-full lg:w-auto p-3 text-gray-800 border border-b text-center block lg:table-cell relative lg:static">
                                            <span class="lg:hidden absolute top-0 left-0 bg-blue-200 px-2 py-1 text-xs font-bold uppercase">Status</span>
                                            <span class={`rounded ${val?.status == "active" && "bg-blue-500"} text-white ${val?.status == "delivered" && "bg-green-400"} ${val?.status == "pending" && "bg-yellow-400"} } ${val?.status == "cancelled" && "bg-red-500"} py-1 px-3 text-xs font-bold`}>{val?.status}</span>
                                            <br />
                                            {
                                                val?.status == "delivered" && val?.rated == null ? <button className='text-blue-600 relative top-1' onClick={() => open2Modal(val)}>Tap to submit review</button> : null
                                            }
                                        </td>
                                        <td class="w-full lg:w-auto p-3 text-gray-800 border border-b text-center block lg:table-cell relative lg:static">
                                            <span class="lg:hidden absolute top-0 left-0 bg-blue-200 px-2 py-1 text-xs font-bold uppercase">Total</span>
                                            <span>
                                                Rs {val?.totalPrice}/-
                                            </span>
                                        </td>
                                        <td class="w-full lg:w-auto p-3 text-gray-800 border border-b text-center block lg:table-cell relative lg:static">
                                            <span class="lg:hidden absolute top-0 left-0 bg-blue-200 px-2 py-1 text-xs font-bold uppercase">Details</span>
                                            <span>
                                                {
                                                    val?.totalItems?.map((val, index) => {
                                                        return (
                                                            <p key={index + index}>
                                                                {
                                                                    `${val?.name}, ${val?.qty} pcs `
                                                                }
                                                            </p>
                                                        )
                                                    })
                                                }
                                            </span>
                                        </td>
                                        <td class="w-full lg:w-auto p-3 text-gray-800 border border-b text-center block lg:table-cell relative lg:static">
                                            <span class="lg:hidden absolute top-0 left-0 bg-blue-200 px-2 py-1 text-xs font-bold uppercase">Inquiry Number</span>
                                            <a href={`tel:${ownerPhoneNumber}`} className='underline text-blue-600'>{ownerPhoneNumber}</a>
                                        </td>
                                    </tr>
                                )
                            }) : <div className='flex justify-center items-center min-h-[90vh] w-screen'>
                                Order history is empty
                            </div>
                        }
                    </tbody>
                </table>

                {/* Table Ends  */}

                <Footer />

                {/* Cart Starts */}

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
                    title="How was your experience"
                    centered
                    open={modal2Open}
                    okType='default'
                    okText="submit"
                    onOk={() => submitReview()}
                    onCancel={() => setModal2Open(false)}
                >
                    <Rating
                        emptySymbol={<AiOutlineStar className='text-xl' />}
                        fullSymbol={<AiFillStar className='text-yellow-600 text-xl' />}
                        fractions={2}
                        initialRating={0}
                        onChange={value => setRating(value)}
                        readonly={false} // set the readonly prop to false
                    />
                    <textarea onChange={(e) => setReviewMsg(e.target.value)} value={reviewMsg} name="review" id="" rows="3" className='w-full' style={{ resize: "none" }} placeholder="Write an honest review about an order you've received "></textarea>
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

            </main>
        </>
    )
}