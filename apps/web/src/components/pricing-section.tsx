"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check } from "lucide-react";
import Link from "next/link";

export function PricingSection() {
  const plans = [
    {
      name: "Starter",
      description: "Perfect for individual developers and small projects",
      price: "$49",
      period: "per month",
      features: [
        "1 Database Connection",
        "Up to 3 Indexing Configurations",
        "10 Requests per Second",
        "7-Day Data Retention",
        "Email Support",
      ],
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Pro",
      description: "Ideal for growing projects and small teams",
      price: "$149",
      period: "per month",
      features: [
        "3 Database Connections",
        "Up to 10 Indexing Configurations",
        "50 Requests per Second",
        "30-Day Data Retention",
        "Priority Support",
        "Custom Webhooks",
      ],
      cta: "Get Started",
      popular: true,
    },
    {
      name: "Enterprise",
      description: "For large-scale applications and teams",
      price: "Custom",
      period: "contact us for pricing",
      features: [
        "Unlimited Database Connections",
        "Unlimited Indexing Configurations",
        "Custom Request Limits",
        "90-Day Data Retention",
        "24/7 Priority Support",
        "Custom Integrations",
        "Dedicated Account Manager",
      ],
      cta: "Contact Us",
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold mb-4"
          >
            Simple, Transparent Pricing
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-muted-foreground text-lg"
          >
            Choose the plan that fits your needs. All plans include core
            features.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex"
            >
              <Card
                className={`w-full border-border/50 ${plan.popular ? "glow-effect relative z-10 scale-105" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground ml-2">
                      {plan.period}
                    </span>
                  </div>
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link
                    href={plan.name === "Enterprise" ? "/contact" : "/signup"}
                    className="w-full"
                  >
                    <Button
                      variant={plan.popular ? "default" : "outline"}
                      className="w-full"
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
