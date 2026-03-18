"use client";

import { useEffect, useState } from "react";
import { 
  HelpCircle, 
  Search, 
  MessageSquare, 
  Mail, 
  Phone, 
  Book, 
  Video, 
  FileText, 
  ChevronRight, 
  Send,
  Lock,
  Zap,
  Percent
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

export default function HelpPage() {
  const { user } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      fetch("/api/user/me")
        .then(res => res.json())
        .then(data => setIsAdmin(data.role === "ADMIN"))
        .catch(() => {});
    }
  }, [user]);

  const [searchTerm, setSearchTerm] = useState("");

  const helpCategories = [
    { id: 1, name: "Getting Started", icon: <Book size={24} />, description: "Learn the basics of Kravy POS", articles: 12 },
    { id: 2, name: "Billing & Workflow", icon: <FileText size={24} />, description: "Master billing operations", articles: 8, href: "/dashboard/docs/workflow" },
    { id: 3, name: "Menu Management", icon: <MessageSquare size={24} />, description: "Manage your menu items", articles: 15, href: "/dashboard/docs/menu-management" },
    { id: 7, name: "GST & HSN Billing", icon: <Percent size={24} />, description: "Setup professional GST bills", articles: 1, href: "/dashboard/docs/gst-billing" },
    { id: 8, name: "Advanced GST & Categories", icon: <Zap size={24} />, description: "Product-wise GST & Category Pro guide", articles: 1, href: "/dashboard/docs/gst-category-pro" },
    { id: 4, name: "Video Tutorials", icon: <Video size={24} />, description: "Watch step-by-step guides", articles: 6 },
    ...(isAdmin ? [
      { 
        id: 5, 
        name: "Staff Access Docs", 
        icon: <Lock size={24} />, 
        description: "Deep technical guide for access control", 
        articles: 1,
        href: "/dashboard/docs/staff-access" 
      },
      { 
        id: 6, 
        name: "Premium Visual Guide", 
        icon: <Zap size={24} />, 
        description: "Interactive animated guide for staff setup", 
        articles: 1,
        href: "/dashboard/docs/staff-access/interactive",
        isPremium: true
      }
    ] : []),
  ];

  const faqItems = [
    {
      question: "How do I create a new bill?",
      answer: "Navigate to the 'New Order' section from the sidebar, add items to the cart, select customer details, and choose payment method to complete the transaction.",
      category: "Billing"
    },
    {
      question: "Can I export my sales data?",
      answer: "Yes! Go to Reports section and use the export button to download your sales data in CSV or Excel format.",
      category: "Reports"
    },
    {
      question: "How do I manage menu items?",
      answer: "Visit the 'Menu Items' section under MANAGE in the sidebar. You can add, edit, or remove items and update their prices.",
      category: "Menu"
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely! We use industry-standard encryption and regular backups to ensure your data is always safe and secure.",
      category: "Security"
    },
    {
      question: "Bill par GST aur HSN kaise dikhayein?",
      answer: "Profile section mein jaiye aur 'Enable Tax' aur 'Enable HSN on Bill' options ko tik karein. Isse aapke bills par automatic tax calculation aur HSN codes dikhna shuru ho jayenge.",
      category: "Billing"
    },
    {
      question: "Amount in words bill par kaise ata hai?",
      answer: "Ye system automatic hai. Jab bhi aap koi bill print karte hain, system grand total ko Indian Rupees words mein convert karke bill ke neeche print kar deta hai.",
      category: "Billing"
    },
  ];

  const filteredFAQs = faqItems.filter(item =>
    item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--kravy-text-primary)", letterSpacing: "-1px" }}>
            Help & Support Center
          </h1>
          <p style={{ fontSize: "0.85rem", color: "var(--kravy-text-muted)", marginTop: "4px", fontStyle: "italic" }}>
            Find answers, tutorials, and get assistance when you need it.
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button style={{
            background: "var(--kravy-bg-2)",
            color: "var(--kravy-text-primary)",
            border: "1px solid var(--kravy-border)",
            padding: "12px 20px",
            borderRadius: "12px",
            fontWeight: 700,
            fontSize: "0.9rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <Phone size={18} /> Contact Support
          </button>
          <button style={{
            background: "var(--kravy-brand)",
            color: "white",
            border: "none",
            padding: "12px 20px",
            borderRadius: "12px",
            fontWeight: 700,
            fontSize: "0.9rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 4px 16px rgba(139,92,246,0.3)"
          }}>
            <MessageSquare size={18} /> Live Chat
          </button>
        </div>
      </div>

      {/* Quick Search */}
      <div style={{ position: "relative", maxWidth: "600px" }}>
        <Search size={20} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--kravy-text-muted)" }} />
        <input
          type="text"
          placeholder="Search for help articles, FAQs, and tutorials..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            padding: "16px 20px 16px 52px",
            background: "var(--kravy-input-bg)",
            border: "1px solid var(--kravy-input-border)",
            borderRadius: "16px",
            color: "var(--kravy-text-primary)",
            fontSize: "0.95rem",
            outline: "none"
          }}
        />
      </div>

      {/* Help Categories */}
      <div>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 900, color: "var(--kravy-text-primary)", marginBottom: "20px", letterSpacing: "-0.5px" }}>
          Browse Help Categories
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
          {helpCategories.map((category) => {
            const content = (
              <div
                key={category.id}
                style={{
                  background: (category as any).isPremium ? "linear-gradient(135deg, white 0%, #FFF8F0 100%)" : "var(--kravy-surface)",
                  border: (category as any).isPremium ? "2px solid #FF6B00" : "1px solid var(--kravy-border)",
                  borderRadius: "24px",
                  padding: "24px",
                  cursor: "pointer",
                  transition: "all 0.3s",
                  boxShadow: (category as any).isPremium ? "0 10px 30px rgba(255,107,0,0.1)" : "var(--kravy-card-shadow)",
                  height: "100%",
                  position: "relative",
                  overflow: "hidden"
                }}
              >
                {(category as any).isPremium && (
                  <div style={{
                    position: "absolute",
                    top: "12px",
                    right: "-30px",
                    background: "#FF6B00",
                    color: "white",
                    fontSize: "0.6rem",
                    fontWeight: 900,
                    padding: "4px 35px",
                    transform: "rotate(45deg)",
                    textTransform: "uppercase"
                  }}>
                    Premium
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                  <div style={{
                    width: "48px", height: "48px", borderRadius: "14px",
                    background: (category as any).isPremium ? "linear-gradient(135deg, #FF6B00, #FFB830)" : "var(--kravy-brand)", 
                    color: "white",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    {category.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--kravy-text-primary)", marginBottom: "4px" }}>
                      {category.name}
                    </h3>
                    <p style={{ fontSize: "0.8rem", color: "var(--kravy-text-muted)", lineHeight: "1.4" }}>
                      {category.description}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--kravy-text-muted)", fontStyle: "italic" }}>
                    {category.articles} articles
                  </span>
                  <ChevronRight size={16} style={{ color: "var(--kravy-text-muted)" }} />
                </div>
              </div>
            );

            return (category as any).href ? (
              <Link key={category.id} href={(category as any).href} style={{ textDecoration: "none" }}>
                {content}
              </Link>
            ) : content;
          })}
        </div>
      </div>

      {/* FAQ Section */}
      <div>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 900, color: "var(--kravy-text-primary)", marginBottom: "20px", letterSpacing: "-0.5px" }}>
          Frequently Asked Questions
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filteredFAQs.map((faq, index) => (
            <div
              key={index}
              style={{
                background: "var(--kravy-surface)",
                border: "1px solid var(--kravy-border)",
                borderRadius: "20px",
                padding: "20px",
                boxShadow: "var(--kravy-card-shadow)"
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <div style={{
                  width: "32px", height: "32px", borderRadius: "10px",
                  background: "var(--kravy-brand)", color: "white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, marginTop: "4px"
                }}>
                  <HelpCircle size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--kravy-text-primary)", marginBottom: "8px" }}>
                    {faq.question}
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--kravy-text-muted)", lineHeight: "1.6", marginBottom: "12px" }}>
                    {faq.answer}
                  </p>
                  <span style={{
                    fontSize: "0.75rem", color: "var(--kravy-brand)",
                    background: "rgba(139, 92, 246, 0.1)", border: "1px solid rgba(139, 92, 246, 0.2)",
                    padding: "4px 12px",
                    borderRadius: "10px", fontWeight: 900,
                    textTransform: "uppercase", letterSpacing: "1px"
                  }}>
                    {faq.category}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Support */}
      <div style={{
        background: "var(--kravy-bg-2)",
        border: "1px solid var(--kravy-border)",
        borderRadius: "32px",
        padding: "48px 32px",
        textAlign: "center",
        boxShadow: "var(--kravy-card-shadow)"
      }}>
        <div style={{
          width: "64px", height: "64px", borderRadius: "18px",
          background: "var(--kravy-brand)", color: "white",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px",
          boxShadow: "0 8px 24px rgba(139,92,246,0.3)"
        }}>
          <MessageSquare size={32} />
        </div>
        <h2 style={{ fontSize: "1.6rem", fontWeight: 900, color: "var(--kravy-text-primary)", marginBottom: "12px" }}>
          Still need help?
        </h2>
        <p style={{ fontSize: "0.9rem", color: "var(--kravy-text-muted)", marginBottom: "32px", maxWidth: "500px", margin: "0 auto 32px", fontStyle: "italic" }}>
          Our support team is available 24/7 to help you with any questions or issues you might have.
        </p>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
          <button style={{
            background: "var(--kravy-brand)",
            color: "white",
            border: "none",
            padding: "16px 36px",
            borderRadius: "14px",
            fontWeight: 800,
            fontSize: "0.95rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 8px 20px rgba(139,92,246,0.3)"
          }}>
            <Send size={18} /> Start Live Chat
          </button>
          <button style={{
            background: "var(--kravy-bg-2)",
            color: "var(--kravy-text-primary)",
            border: "1px solid var(--kravy-border)",
            padding: "16px 36px",
            borderRadius: "14px",
            fontWeight: 800,
            fontSize: "0.95rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <Mail size={18} /> Email Support
          </button>
        </div>
      </div>
    </div>
  );
}
