import Link from "next/link";
import { Mail, Share2, X, MessageCircle, Code } from "lucide-react";

import { Container } from "@/components/layout/container";

const footerLinks = {
  product: [
    { label: "Tính năng", href: "#features" },
    { label: "Giá cả", href: "#pricing" },
    { label: "Tích hợp", href: "#integrations" },
    { label: "Cập nhật", href: "#updates" },
  ],
  resources: [
    { label: "Tài liệu", href: "#docs" },
    { label: "Hướng dẫn", href: "#guides" },
    { label: "Blog", href: "#blog" },
    { label: "FAQ", href: "#faq" },
  ],
  community: [
    { label: "Diễn đàn", href: "#forum" },
    { label: "Sự kiện", href: "#events" },
    { label: "Discord", href: "#discord" },
    { label: "GitHub", href: "#github" },
  ],
  contact: [
    { label: "Liên hệ", href: "#contact" },
    { label: "Hỗ trợ", href: "#support" },
    { label: "Phản hồi", href: "#feedback" },
    { label: "Đối tác", href: "#partners" },
  ],
} as const;

const socialLinks = [
  { icon: X, href: "#", label: "Twitter" },
  { icon: MessageCircle, href: "#", label: "LinkedIn" },
  { icon: Code, href: "#", label: "GitHub" },
  { icon: Mail, href: "#", label: "Email" },
] as const;

export function LandingFooter() {
  return (
    <footer className="border-t border-white/10 bg-slate-950 py-12" role="contentinfo">
      <Container className="max-w-7xl">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h3 className="text-lg font-bold text-white">
              Community Project Lab
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              Nền tảng đổi mới giáo dục cho học sinh
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-white">
              Sản phẩm
            </h4>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 transition-colors hover:text-white hover:scale-105 inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-white">
              Tài nguyên
            </h4>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 transition-colors hover:text-white hover:scale-105 inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-white">
              Cộng đồng
            </h4>
            <ul className="space-y-2">
              {footerLinks.community.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 transition-colors hover:text-white hover:scale-105 inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-white">
              Liên hệ
            </h4>
            <ul className="space-y-2">
              {footerLinks.contact.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 transition-colors hover:text-white hover:scale-105 inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-sm text-slate-400">
            © 2024 Community Project Lab. Được xây dựng cho sự đổi mới do học sinh dẫn dắt.
          </p>

          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <Link
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="flex size-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition-all duration-200 hover:bg-primary/10 hover:text-white hover:border-primary/30 hover:scale-110"
              >
                <social.icon className="size-5" aria-hidden="true" />
              </Link>
            ))}
          </div>

          <div className="flex gap-4">
            <Link
              href="#privacy"
              className="text-sm text-slate-400 transition-colors hover:text-white hover:scale-105 inline-block"
            >
              Chính sách bảo mật
            </Link>
            <Link
              href="#terms"
              className="text-sm text-slate-400 transition-colors hover:text-white hover:scale-105 inline-block"
            >
              Điều khoản sử dụng
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
