"use client"

import React from 'react'
import Link from 'next/link'
import { Button } from '../ui/button'
import { ChevronRight, Play } from 'lucide-react'
import Image from 'next/image'

const HeroSection = () => {
    return (
        <section className='min-h-screen flex items-center justify-center text-center md:text-start'>
            <div className="max-w-7xl w-full flex flex-col md:flex-row items-center justify-between gap-8 pt-32 pb-25 px-6">

                {/* Left hero content */}
                <div className='flex-1 justify-center items-center'>
                    <h1 className="text-5xl md:text-7xl leading-tight mb-6 gradient-title">
                        Manage Your Expenses Easily With<span className="text-emerald-400"> Intelligence.</span>
                    </h1>
                    <p className="text-gray-500 w-full text-lg mb-8 md:mb-10 md:max-w-md">
                        AI-driven personal financial management platform — track spending, unlock insights, and optimize your money flow in real time.
                    </p>
                    <div className='flex items-center justify-center md:justify-start gap-4 mb-6'>
                        <Link href={"/dashboard"}>
                            <Button size={"lg"} className='bg-gradient-to-r from-indigo-600 to-emerald-500 text-white p-6 rounded-full font-semibold hover:brightness-110 transition'>
                                Get Started
                                <ChevronRight className='bg-white text-black/80 rounded-full size-6'/>
                            </Button>
                        </Link>
                        <Link target='_blank' href={"https://youtu.be/rOLyWlDpb8Q?si=dt7pnRfNulim2cCG"}>
                            <Button size="lg" variant={"outline"} className='p-6 cursor-pointer rounded-full transition'>
                                <Play />
                                View Demo
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Right Hero Section */}
                <div className="flex-1 flex items-center justify-center relative">
                    <Image width={500} height={500} src={"/hero-section-img.svg"} alt="Phone Mockup" className="z-10" />
                </div>
            </div>
        </section>
    )
}

export default HeroSection