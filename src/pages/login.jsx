import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react"
import { useRouter } from "next/router";
import { HiOutlineMail, HiKey } from 'react-icons/hi'
import { auth } from "@/config/firebase.config";
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import Swal from "sweetalert2";

function Login() {
    const router = useRouter();
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(true)

    const signIn = () => {
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Signed in 
                const user = userCredential.user;
                router.push("/")
                // ...
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                Swal.fire({
                    icon: "error",
                    title: "Oops!",
                    text: errorCode.slice(5).split("-").join(" "),
                })
            });
    }

    useEffect(() => {
        onAuthStateChanged(auth, (user) => {
            if (!user) {
                setIsLoading(false)
            } else {
                router.push("/")
            }
        });
    }, [])

    return (
        <>
            <Head>
                <title>SDC - Login</title>
            </Head>
            {
                isLoading && <div role="status" className='flex w-full h-screen justify-center items-center'>
                    <svg aria-hidden="true" class="inline w-16 h-16 mr-2 text-gray-200 animate-spin dark:text-gray-600 fill-[#94c755]" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                    </svg>
                    <span class="sr-only">Loading...</span>
                </div>
            }
            {
                !isLoading && <div
                    class="min-h-screen flex flex-col items-center justify-center bg-gray-100"
                >
                    <div
                        class="
  flex flex-col
  bg-white
  shadow-md
  px-4
  sm:px-6
  md:px-8
  lg:px-10
  py-8
  rounded-3xl w-50 max-w-md
"
                    >
                        <div class="font-medium self-center text-xl sm:text-3xl text-gray-800">
                            Welcome Back
                        </div>
                        <div class="mt-4 self-center text-xl sm:text-sm text-gray-800">
                            Enter your credentials to access your account
                        </div>

                        <div class="mt-10">
                            <div class="flex flex-col mb-5">
                                <label
                                    for="email"
                                    class="mb-1 text-xs tracking-wide text-gray-600"
                                >E-Mail Address:</label>
                                <div class="relative">
                                    <div
                                        class="
            inline-flex
            items-center
            justify-center
            absolute
            left-0
            top-0
            h-full
            w-10
            text-gray-400
          "
                                    >
                                        <HiOutlineMail className="w-5 h-5" />
                                    </div>

                                    <input
                                        id="email"
                                        type="email"
                                        name="email"
                                        class="
            text-sm
            placeholder-gray-500
            pl-10
            pr-4
            rounded-2xl
            border border-gray-400
            w-full
            py-2
            focus:outline-none focus:border-blue-400
          "
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div class="flex flex-col mb-6">
                                <label
                                    for="password"
                                    class="mb-1 text-xs sm:text-sm tracking-wide text-gray-600"
                                >Password:</label
                                >
                                <div class="relative">
                                    <div
                                        class="
            inline-flex
            items-center
            justify-center
            absolute
            left-0
            top-0
            h-full
            w-10
            text-gray-400
          "
                                    >
                                        <span>
                                            <HiKey />
                                        </span>
                                    </div>

                                    <input
                                        id="password"
                                        type="password"
                                        name="password"
                                        value={password}
                                        class="
            text-sm
            placeholder-gray-500
            pl-10
            pr-4
            rounded-2xl
            border border-gray-400
            w-full
            py-2
            focus:outline-none focus:border-blue-400
          "
                                        placeholder="Enter your password"
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div class="flex w-full">
                                <button
                                    onClick={signIn}
                                    class="
          flex
          mt-2
          items-center
          justify-center
          focus:outline-none
          text-white text-sm
          sm:text-base
          bg-[#94c755]
          rounded-2xl
          py-2
          w-full
          transition
          duration-150
          ease-in
        "
                                >
                                    <span class="mr-2 uppercase ">Sign In</span>
                                    <span>
                                        <svg
                                            class="h-6 w-6"
                                            fill="none"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="flex justify-center items-center mt-6">
                        <div
                            class="
    inline-flex
    items-center
    text-gray-700
    font-medium
    text-xs text-center
  "
                        >
                            <span class="ml-2"
                            >You don't have an account?
                                <Link
                                    href="/register"
                                    class="text-xs ml-2 text-[#94c755] font-semibold"
                                >Register now</Link>
                            </span>
                        </div>
                    </div>
                    <div class="flex justify-center items-center mt-6">
                        <div
                            class="
    inline-flex
    items-center
    text-gray-700
    font-medium
    text-xs text-center
  "
                        >
                            <span class="ml-2"
                            >Forgot password?
                                <Link
                                    href="/forgot-password"
                                    class="text-xs ml-2 text-[#94c755] font-semibold"
                                > Reset password!</Link>
                            </span>
                        </div>
                    </div>
                </div>
            }

        </>
    )
}

export default Login