"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Quote } from "lucide-react";

export function TestimonialsSection() {
  const testimonials = [
    {
      quote:
        "HeliusIndex has completely transformed how we handle blockchain data. No more infrastructure headaches, just clean data in our database.",
      author: "Alex Johnson",
      role: "CTO at BlockFi",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      quote:
        "Setting up our own indexing infrastructure was a nightmare. With HeliusIndex, we were up and running in minutes. Game changer!",
      author: "Sarah Chen",
      role: "Lead Developer at CryptoTrack",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      quote:
        "The ability to customize exactly what data we index has been invaluable. We're only storing what we need, which has made our app much more efficient.",
      author: "Michael Rodriguez",
      role: "Founder at NFTVault",
      avatar: "/placeholder.svg?height=40&width=40",
    },
  ];

  return (
    <section className="py-20 md:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold mb-4"
          >
            What Our Users Say
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-muted-foreground text-lg"
          >
            Join hundreds of developers who are already using HeliusIndex
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <Quote className="h-8 w-8 text-primary/40 mb-4" />
                  <p className="mb-6 text-muted-foreground">
                    "{testimonial.quote}"
                  </p>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage
                        src={testimonial.avatar}
                        alt={testimonial.author}
                      />
                      <AvatarFallback>
                        {testimonial.author
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">
                        {testimonial.author}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
