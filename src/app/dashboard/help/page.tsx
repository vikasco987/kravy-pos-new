"use client";

import { useState } from "react";
import { HelpCircle, Search, MessageSquare, Mail, Phone, Book, Video, FileText, Download, Star, ChevronRight, Send } from "lucide-react";

export default function HelpPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const helpCategories = [
    { id: 1, name: "Getting Started", icon: <Book size={24} />, description: "Learn the basics of Kravy POS", articles: 12 },
    { id: 2, name: "Billing & Payments", icon: <FileText size={24} />, description: "Master billing operations", articles: 8 },
    { id: 3, name: "Menu Management", icon: <MessageSquare size={24} />, description: "Manage your menu items", articles: 15 },
    { id: 4, name: "Video Tutorials", icon: <Video size={24} />, description: "Watch step-by-step guides", articles: 6 },
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
          <h1 style={{ fontSize: "1.8rem", fontWeight: 900, color: "#F1F0EC", letterSpacing: "-1px" }}>
            Help & Support Center
          </h1>
          <p style={{ fontSize: "0.85rem", color: "#4A5568", marginTop: "4px" }}>
            Find answers, tutorials, and get assistance when you need it.
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button style={{
            background: "rgba(255,255,255,0.06)",
            color: "#F1F0EC",
            border: "1px solid rgba(255,255,255,0.1)",
            padding: "12px 20px",
            borderRadius: "12px",
            fontWeight: 600,
            fontSize: "0.9rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <Phone size={18} /> Contact Support
          </button>
          <button style={{
            background: "linear-gradient(135deg, #FF6B35, #F59E0B)",
            color: "white",
            border: "none",
            padding: "12px 20px",
            borderRadius: "12px",
            fontWeight: 600,
            fontSize: "0.9rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 4px 16px rgba(255,107,53,0.3)"
          }}>
            <MessageSquare size={18} /> Live Chat
          </button>
        </div>
      </div>

      {/* Quick Search */}
      <div style={{ position: "relative", maxWidth: "600px" }}>
        <Search size={20} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#6B7280" }} />
        <input
          type="text"
          placeholder="Search for help articles, FAQs, and tutorials..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            padding: "16px 20px 16px 52px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "16px",
            color: "#F1F0EC",
            fontSize: "0.95rem",
            outline: "none"
          }}
        />
      </div>

      {/* Help Categories */}
      <div>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#F1F0EC", marginBottom: "20px" }}>
          Browse Help Categories
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
          {helpCategories.map((category) => (
            <div
              key={category.id}
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "16px",
                padding: "24px",
                cursor: "pointer",
                transition: "all 0.3s",
                backdropFilter: "blur(10px)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,107,53,0.05)";
                e.currentTarget.style.borderColor = "rgba(255,107,53,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                <div style={{
                  width: "48px", height: "48px", borderRadius: "12px",
                  background: "rgba(255,107,53,0.1)", color: "#FF6B35",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  {category.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#F1F0EC", marginBottom: "4px" }}>
                    {category.name}
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "#6B7280", lineHeight: "1.4" }}>
                    {category.description}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.75rem", color: "#4A5568" }}>
                  {category.articles} articles
                </span>
                <ChevronRight size={16} style={{ color: "#6B7280" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#F1F0EC", marginBottom: "20px" }}>
          Frequently Asked Questions
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filteredFAQs.map((faq, index) => (
            <div
              key={index}
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "16px",
                padding: "20px",
                backdropFilter: "blur(10px)"
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <div style={{
                  width: "32px", height: "32px", borderRadius: "8px",
                  background: "rgba(139,92,246,0.1)", color: "#8B5CF6",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, marginTop: "4px"
                }}>
                  <HelpCircle size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#F1F0EC", marginBottom: "8px" }}>
                    {faq.question}
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "#6B7280", lineHeight: "1.6", marginBottom: "12px" }}>
                    {faq.answer}
                  </p>
                  <span style={{
                    fontSize: "0.75rem", color: "#FF6B35",
                    background: "rgba(255,107,53,0.1)", padding: "4px 10px",
                    borderRadius: "12px", fontWeight: 600
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
        background: "linear-gradient(135deg, rgba(255,107,53,0.1), rgba(245,158,11,0.05))",
        border: "1px solid rgba(255,107,53,0.2)",
        borderRadius: "20px",
        padding: "32px",
        textAlign: "center",
        backdropFilter: "blur(10px)"
      }}>
        <div style={{
          width: "64px", height: "64px", borderRadius: "16px",
          background: "rgba(255,107,53,0.2)", color: "#FF6B35",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px"
        }}>
          <MessageSquare size={32} />
        </div>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#F1F0EC", marginBottom: "12px" }}>
          Still need help?
        </h2>
        <p style={{ fontSize: "0.95rem", color: "#6B7280", marginBottom: "24px", maxWidth: "500px", margin: "0 auto 24px" }}>
          Our support team is available 24/7 to help you with any questions or issues you might have.
        </p>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
          <button style={{
            background: "linear-gradient(135deg, #FF6B35, #F59E0B)",
            color: "white",
            border: "none",
            padding: "14px 28px",
            borderRadius: "12px",
            fontWeight: 700,
            fontSize: "0.95rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 4px 16px rgba(255,107,53,0.3)"
          }}>
            <Send size={18} /> Start Live Chat
          </button>
          <button style={{
            background: "rgba(255,255,255,0.06)",
            color: "#F1F0EC",
            border: "1px solid rgba(255,255,255,0.1)",
            padding: "14px 28px",
            borderRadius: "12px",
            fontWeight: 700,
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
