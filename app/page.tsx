import HeroSection from "@/components/custom/hero-section";
import { featuresData, statsData, howItWorksData, testimonialsData } from "@/data/landing";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import FeatureCard from "@/components/custom/feature-card";
import HowItWorkCard from "@/components/custom/how-it-work-card";
import { Card, CardContent } from "@/components/ui/card";

export default async function Home() {
  return (
    <div>
      {/* Hero Section */}
      <HeroSection />

      <section className="py-20 px-10 bg-indigo-50">
        <div className="container mx-auto space-y-20">
          <div className="w-full text-center">
            <h2 className="text-4xl font-semibold text-black/90">
              Trusted by More than <span className="text-emerald-500">50,000</span> Peoples
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {statsData.map((statsData, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {statsData.value}
                </div>
                <div className="text-gray-600">
                  {statsData.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:px-10">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-black/90">
            What makes us different?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuresData.map((feature, index) => (
              <FeatureCard key={index} icon={feature.icon as any} title={feature.title} description={feature.description} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-blue-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-black/90">
          3 Simple Steps to Master Your Money
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {howItWorksData.map((step, index) => (
              <HowItWorkCard key={index} icon={step.icon as any} title={step.title} description={step.description} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:px-10">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            What Our Users Say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonialsData.map((testimonial, index) => (
              <Card key={index} className="p-6 shadow-sm hover:shadow-lg">
                <CardContent className="pt-4">
                  <div className="flex items-center mb-4">
                    <Image
                      src={testimonial.image}
                      alt={testimonial.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                    <div className="ml-4">
                      <div className="font-semibold">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600">
                    {testimonial.quote}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-indigo-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Ready to Take Control of Your finances?
          </h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already managing their finances smarter with Expense Tracker
          </p>
          <Link href="/dashboard">
            <Button
              size="lg"
              className="bg-white text-indigo-600 hover:bg-blue-50 animate-bounce">
              Start Free Trial
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
