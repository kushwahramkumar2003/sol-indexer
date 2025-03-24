"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

export function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Connect Your Database",
      description:
        "Provide your Postgres database credentials securely. We'll test the connection to ensure everything works.",
    },
    {
      number: "02",
      title: "Configure Indexing",
      description:
        "Choose what blockchain data you want to index - NFT prices, token data, transactions, and more.",
    },
    {
      number: "03",
      title: "We Handle the Rest",
      description:
        "Our system automatically starts indexing the data you selected and populates your database in real-time.",
    },
    {
      number: "04",
      title: "Build Your Application",
      description:
        "With your database now populated with blockchain data, you can focus on building your application.",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold mb-4"
          >
            How It Works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-muted-foreground text-lg"
          >
            Get started in minutes with our simple four-step process
          </motion.p>
        </div>

        <div className="max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col md:flex-row gap-6 mb-12 md:mb-20 relative"
            >
              {index < steps.length - 1 && (
                <div className="absolute left-6 top-16 bottom-0 w-px bg-border hidden md:block"></div>
              )}
              <div className="flex-shrink-0 flex items-start">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold relative z-10">
                  {step.number}
                </div>
              </div>
              <div className="pt-1">
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-muted-foreground mb-4">{step.description}</p>
                <div className="flex flex-col gap-2">
                  {index === 0 && (
                    <>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span className="text-sm">
                          Secure credential storage
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span className="text-sm">
                          Automatic connection testing
                        </span>
                      </div>
                    </>
                  )}
                  {index === 1 && (
                    <>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span className="text-sm">
                          Customizable data selection
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span className="text-sm">
                          Multiple blockchain networks
                        </span>
                      </div>
                    </>
                  )}
                  {index === 2 && (
                    <>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span className="text-sm">Real-time data updates</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span className="text-sm">
                          Automatic schema creation
                        </span>
                      </div>
                    </>
                  )}
                  {index === 3 && (
                    <>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span className="text-sm">
                          Query your data directly
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span className="text-sm">Build with confidence</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
