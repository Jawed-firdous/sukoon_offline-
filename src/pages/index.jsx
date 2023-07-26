import Head from 'next/head'
import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FiShoppingCart } from "react-icons/fi"
import { useState, useMemo } from 'react'
import logo from "../../public/logo.png"
import { auth, db } from '@/config/firebase.config'
import { onSnapshot, query, collection, addDoc, doc, getDoc, where, Timestamp, updateDoc } from 'firebase/firestore'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { AiOutlineCheckCircle, AiOutlinePlus, AiOutlineMinus, AiOutlineUser, AiOutlineEyeInvisible, AiTwotoneEye, AiOutlineKey } from "react-icons/ai"
import { Carousel } from 'antd'
import { Button, message, Divider, notification, Space, Dropdown, Menu, Modal, Input } from 'antd';
import { signOut, reauthenticateWithCredential, sendPasswordResetEmail, onAuthStateChanged } from "firebase/auth";
import axios from 'axios'
import { FaBars } from 'react-icons/fa'
import { secureRandom } from '@/components/repeatedFunctions'
import Footer from '@/components/footer'

export default function Home() {
  const [isNavbarShown, setNavbarShown] = useState(false)
  const [rating, setRating] = useState(4);
  const [hover, setHover] = useState(4);
  const [showCart, setShowCart] = useState(false)
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [api, notifictionContextHolder] = notification.useNotification();
  const [total, setTotal] = useState(0);
  const [cartChange, setCartChange] = useState(false)
  const [messageApi, contextHolder] = message.useMessage();
  const phoneRegExp = /^(\+92|92|0)?(3\d{2}|5\d{2}|6\d{2}|7\d{2}|8\d{2})[ -]?\d{7}$/;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [passwordVisible, setPasswordVisible] = React.useState(false);
  const [userData, setUserData] = useState()
  const [isLoading, setIsLoading] = useState(true)
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

  function fetchProducts() {
    const q = query(collection(db, "products"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const products = [];
      querySnapshot.forEach((doc) => {
        products.push({
          id: doc.id,
          data: doc.data()
        });
      });
      setProducts(products)
      setIsLoading(false)
    });
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

  function cartPersistor() {
    let value = localStorage.getItem("cart")
    if (value == null) {
      localStorage.setItem("cart", JSON.stringify(cart))
    } else if (value !== null) {
      setCart(JSON.parse(value))
      updateProductInLocalStorage()
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
    fetchProducts()
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

  function removeFromCart(id) {
    let index = cart.findIndex(val => val.id === id)
    cart.splice(index, 1)
    localStorage.setItem("cart", JSON.stringify(cart))
    calculatePrice()
    fetchProducts()
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
      setShowCart(!showCart)
      submitForm()
      openNotification('topLeft')
    } catch (e) {
      console.error("Error adding document: ", e);
    }

  }


  const logout = () => {
    signOut(auth).then(() => {
      router.push("/")
      // Sign-out successful.
    }).catch((error) => {
      // An error happened.
    });
  }

  const reAuthenticateUser = () => {
    const user = auth.currentUser;
    const credential = auth.currentUser

    reauthenticateWithCredential(user, credential).then(() => {
      // User re-authenticated.
    }).catch(error => {
    })
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
      <Menu.Item className='w-[150px] border-b-2 hover:bg-gray-300 bg-[#94c755]' key={1}>
        <Link href={"/"}>Home</Link>
      </Menu.Item>
      <Menu.Item className='w-[150px] border-b-2 hover:bg-[#94c755]' key={2}>
        <Link href={"/about"}>About</Link>
      </Menu.Item>
      <Menu.Item className='w-[150px] hover:bg-[#94c755]' key={3}>
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
    fetchProducts()
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
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Sukoon Diabetic Centre - Homeopathic Medicines for Diabetes and Related Problems</title>
        <meta name="description" content="Sukoon Diabetic Centre offers a range of homeopathic medicines for the treatment of diabetes and related problems. Our medicines are made using natural ingredients and are safe for long-term use. Order now and experience the benefits of homeopathy." />
        <meta name="keywords" content="Homeopathic Medicine , Homeopathic , Homeopathic Doctor , Homeopathic Meaning , Homeopathic Allergy Relief , Homeopathic Remedies , Homeopathic Doctors Near Me
 , Homeopathic Medicine Near Me , Homeopathic Definition
 , Homeopathic Ear Drops" />
      </Head>
      <main>


        <nav className="flex justify-between items-center px-3 border-b-2 border-[#94c755] bg-white fixed top-0 z-50 w-full">
          <div>
            <Link href={"/"}>
              <Image src={logo} width={80} height={80} alt='Logo'></Image>
            </Link>          
            </div>
          <ul className="items-center gap-x-8 hidden md:flex">
            <Link href={"/"} className='border-b-2 border-[#94c755] hover:cursor-pointer'>Home</Link>
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

        {/* Navbar Ends  */}

        {
          isLoading && <div role="status" className='flex w-full h-screen justify-center items-center'>
            <svg aria-hidden="true" class="inline w-16 h-16 mr-2 text-gray-200 animate-spin dark:text-gray-600 fill-[#94c755]" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
              <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
            </svg>
            <span class="sr-only">Loading...</span>
          </div>
        }

        {/* Product Listing Starts  */}
        {
          !showCart && !isLoading && <div className='max-w-screen-xl mt-4 mb-16 m-auto flex justify-center gap-5 flex-wrap relative top-14'>

            {
              products?.map((val, index) => {
                return (
                  <>
                    <div key={index} class="relative max-w-[300px] min-w-[300px] bg-white shadow-md rounded-3xl p-2 mx-1 my-3 cursor-pointer border-2 border-[#94c755]">
                      <div class="overflow-x-hidden rounded-2xl relative group h-40">
                        <Link href={{ pathname: "/description", query: { productId: val.id } }}>
                          <Carousel autoplay>
                            {
                              val?.data?.images?.map((val, index) => {
                                return (
                                  <div key={index}>
                                    <div style={contentStyle}>
                                      <img src={val?.url} alt="" className='object-center h-full w-full group-hover:opacity-30' />
                                    </div>
                                  </div>
                                )
                              })
                            }
                          </Carousel>
                        </Link>
                        <div className='hidden md:block transition-[0.5s] ease-linear opacity-0 group-hover:opacity-100 absolute top-[50%] left-[50%] translate-x-[-50%] text-center'>
                          <Link href={{ pathname: "/description", query: { productId: val.id } }} className='bg-[#94c755] p-2 text-white rounded-lg'>View Details</Link>
                        </div>
                        <p class="absolute right-2 top-2 bg-[#94c755] rounded-full p-2 cursor-pointer group">
                          {
                            checkIdExists(val.id) ? <AiOutlineCheckCircle color='#fff' className='w-[25px] h-[25px]' title='Item added to cart' /> : <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 group-hover:opacity-50 opacity-70" fill="none" viewBox="0 0 24 24" stroke="white" onClick={() => { addToCart(val, "plus") }} xlinkTitle="Add to cart">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          }
                        </p>
                      </div>
                      <div class="mt-4 pl-2 mb-2 flex justify-between items-center border-t-2 border-[]">
                        <div >
                          <p class="text-lg font-semibold text-gray-900 mb-0">{val?.data.name}</p>
                          <p class="text-md text-gray-800 mt-0 font-semibold">Rs {val?.data.price}/-</p>
                        </div>
                      </div>
                    </div>
                  </>
                )
              })
            }


          </div>
        }

        {/* <!-- component --> */}

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

      </main>
    </>
  )
}
