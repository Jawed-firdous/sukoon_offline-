import Head from "next/head";
import * as Yup from "yup"
import { useState, useEffect } from "react";
import { db, auth } from "@/config/firebase.config";
import { collection, addDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/router";
import Swal from "sweetalert2";
import { onAuthStateChanged } from "firebase/auth";

function Register() {
    const [errors, setErrors] = useState({})
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [phoneNumber, setPhoneNumber] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [address, setAddress] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isUserLoggedIn, setIsUserLoggedIn] = useState(true)
    const router = useRouter()
    const phoneRegExp = /^(\+92|92|0)?(3\d{2}|5\d{2}|6\d{2}|7\d{2}|8\d{2})[ -]?\d{7}$/;


    const signupValidationSchema = Yup.object().shape({
        firstName: Yup.string().min(3, "Too short name").max(15).required("Name is required"),
        lastName: Yup.string().max(15).min(3, "Last should contain 3 words"),
        phoneNumber: Yup.string().matches(phoneRegExp, "Invalid Phone number").required("Phone number is required"),
        email: Yup.string().email("Invalid email address").required("Email is required"),
        password: Yup.string().required("Password is required").min(8, "Password should contain  8 words"),
        address: Yup.string().min("8", "Please give descriptive address").required("Address is required")
    })


    function handleSubmit(event) {
        event.preventDefault()
        signupValidationSchema.validate({ firstName, lastName, phoneNumber, email, password, address }, { abortEarly: false })
            .then((validatedValues) => {
                setErrors({})
                signUp()
            })
            .catch((err) => {
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

    function signUp() {
        setIsLoading(true)
        createUserWithEmailAndPassword(auth, email, password)
            .then(async (userCredential) => {
                // Signed in 
                const user = userCredential.user;
                try {
                    const docRef = await addDoc(collection(db, "users"), {
                        firstName: firstName,
                        lastName: lastName,
                        address: address,
                        phNo: phoneNumber,
                        email: email,
                        uid: user.uid
                    });

                    router.push("/")
                } catch (e) {
                    console.error("Error adding document: ", e);
                }
                // ...
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                setIsLoading(false)
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: errorCode.slice(5).split("-").join(" ").toUpperCase(),
                })
                // ..
            });
    }

    useEffect(() => {
        onAuthStateChanged(auth, (user) => {
            if (!user) {
                setIsUserLoggedIn(false)
            } else {
                router.push("/")
            }
        });
    }, [])

    return (
        <>
            <Head>
                <title>SDC - Register</title>
            </Head>
            {
                !isUserLoggedIn && <main className=" bg-gray-300 flex justify-center items-center">
                    {/* <!-- component --> */}
                    {/* <!-- Container --> */}
                    <div class="flex flex-wrap min-h-screen w-full content-center justify-center bg-gray-200">
                        <div>
                            <form className="bg-white px-5 py-2 my-3 rounded-lg min-w-[345px]" onSubmit={handleSubmit}>
                                <h1 className="border-b font-semibold text-center py-3">Register</h1>
                                <div class="grid gap-6 md:grid-cols-2 mt-3">
                                    <div>
                                        <label for="first_name" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">First name</label>
                                        <input type="text" id="first_name" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Enter First Name" required onChange={(e) => setFirstName(e.target.value)} />
                                        <p className="text-center text-red-500 mt-2">
                                            {
                                                errors.firstName && errors.firstName
                                            }
                                        </p>
                                    </div>
                                    <div>
                                        <label for="last_name" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Last name</label>
                                        <input type="text" id="last_name" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Enter Last Name" required onChange={(e) => setLastName(e.target.value)} />
                                    </div>
                                    <div>
                                        <label for="address" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Address</label>
                                        <input type="text" id="address" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Enter Address" required onChange={(e) => setAddress(e.target.value)} />
                                        <p className="text-center text-red-500 mt-2">
                                            {
                                                errors.address && errors.address
                                            }
                                        </p>
                                    </div>
                                    <div className="mb-6">
                                        <label for="phone" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Phone number</label>
                                        <input type="tel" id="phone" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="03123456789" required onChange={(e) => setPhoneNumber(e.target.value)} />
                                        <p className="text-center text-red-500 mt-2">
                                            {
                                                errors.phoneNumber && errors.phoneNumber
                                            }
                                        </p>
                                    </div>
                                </div>
                                <div class="mb-6">
                                    <label for="email" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Email address</label>
                                    <input type="email" id="email" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="john.doe@company.com" required onChange={(e) => setEmail(e.target.value)} />
                                    <p className="text-center text-red-500 mt-2">
                                        {
                                            errors.email && errors.email
                                        }
                                    </p>
                                </div>
                                <div class="mb-6">
                                    <label for="password" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Password</label>
                                    <input type="password" id="password" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="•••••••••" required onChange={(e) => setPassword(e.target.value)} />
                                    <p className="text-center text-red-500 mt-2">
                                        {
                                            errors.password && errors.password
                                        }
                                    </p>
                                </div>
                                <div className="flex justify-center flex-col">
                                    {
                                        !isLoading && <button type="submit" class="text-white bg-[#94c755] focus:outline-none font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center">Submit</button>
                                    }
                                    {
                                        isLoading && <button type="button" class="text-white bg-[#94c755] focus:outline-none font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center">Submitting...</button>
                                    }
                                    <Link href={"/login"} className="text-center mt-2">
                                        Already have an account? <span className="text-[#94c755]">Login</span>
                                    </Link>
                                </div>
                            </form>
                        </div>


                    </div>


                </main>
            }
        </>
    )
}

export default Register


