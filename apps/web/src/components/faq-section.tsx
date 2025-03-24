"use client"

import { motion } from "framer-motion"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export function FAQSection() {
  const faqs = [
    {
      question: "How secure are my database credentials?",
      answer:
        "Your database credentials are encrypted using industry-standard encryption and stored securely. We only use them to establish a connection to your database and never store your actual data.",
    },
    {
      question: "What blockchain networks do you support?",
      answer:
        "We currently support Solana Mainnet and Devnet. We're actively working on adding support for more networks in the near future.",
    },
    {
      question: "How real-time is the data?",
      answer:
        "Our system processes blockchain events in near real-time. Typically, data is available in your database within seconds of it appearing on the blockchain.",
    },
    {
      question: "Do I need to modify my database schema?",
      answer:
        "No, our system automatically creates the necessary tables and schemas in your database. You don't need to make any changes to your database structure.",
    },
    {
      question: "What happens if my database goes offline?",
      answer:
        "If your database becomes unavailable, our system will queue the data and retry the connection. Once your database is back online, we'll automatically resume syncing the data.",
    },
    {
      question: "Can I customize what data gets indexed?",
      answer:
        "Yes, you can choose from several predefined indexing categories such as NFT prices, token prices, transactions, and more. You can also specify specific addresses or contracts to monitor.",
    },
  ]

  return (
    <section id="faq" className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold mb-4"
          >
            Frequently Asked Questions
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-muted-foreground text-lg"
          >
            Have questions? We've got answers.
          </motion.p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <AccordionItem value={`item-${index}`}>
                  <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}

