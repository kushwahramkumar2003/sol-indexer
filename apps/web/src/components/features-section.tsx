"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, Server, Shield, Zap, BarChart, Layers } from "lucide-react"

export function FeaturesSection() {
  const features = [
    {
      icon: <Database className="h-10 w-10 text-primary" />,
      title: "Postgres Integration",
      description: "Connect your existing Postgres database and we'll automatically populate it with blockchain data.",
    },
    {
      icon: <Server className="h-10 w-10 text-primary" />,
      title: "No Infrastructure Needed",
      description: "No need to run your own RPC, Geyser, Validator, or webhook infrastructure. We handle it all.",
    },
    {
      icon: <Shield className="h-10 w-10 text-primary" />,
      title: "Secure Credentials",
      description: "Your database credentials are encrypted and securely stored. We never store your data.",
    },
    {
      icon: <Zap className="h-10 w-10 text-primary" />,
      title: "Real-time Updates",
      description: "Get real-time blockchain data updates directly into your database without any delay.",
    },
    {
      icon: <BarChart className="h-10 w-10 text-primary" />,
      title: "Customizable Indexing",
      description: "Choose exactly what data you want to index - NFT prices, token data, transactions, and more.",
    },
    {
      icon: <Layers className="h-10 w-10 text-primary" />,
      title: "Multiple Networks",
      description: "Support for Solana Mainnet and Devnet with more networks coming soon.",
    },
  ]

  return (
    <section id="features" className="py-20 md:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/50 to-background"></div>
      <div className="grid-pattern absolute inset-0 opacity-10"></div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold mb-4"
          >
            Powerful Features for Blockchain Developers
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-muted-foreground text-lg"
          >
            Everything you need to index blockchain data into your Postgres database without the hassle of managing
            infrastructure.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-md hover:shadow-primary/5 transition-all duration-300">
                <CardHeader>
                  <div className="mb-4">{feature.icon}</div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground text-sm">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

