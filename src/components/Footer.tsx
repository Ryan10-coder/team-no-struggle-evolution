import { Users, Phone, Mail, MapPin, Heart, Facebook, Twitter, Instagram, Linkedin, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { name: 'About Us', href: '#about' },
    { name: 'Membership Plans', href: '#membership' },
    { name: 'Registration', href: '#register' },
    { name: 'Contact', href: '#contact' },
  ];

  const supportLinks = [
    { name: 'Help Center', href: '#' },
    { name: 'Emergency Support', href: '#' },
    { name: 'Member Portal', href: '#' },
    { name: 'Community Guidelines', href: '#' },
  ];

  const legalLinks = [
    { name: 'Privacy Policy', href: '/privacy-policy' },
    { name: 'Terms of Service', href: '/terms-of-service' },
    { name: 'Member Agreement', href: '/member-agreement' },
    { name: 'Complaint Resolution', href: '#' },
  ];

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
  ];

  const scrollToSection = (href: string) => {
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <footer className="relative bg-gradient-to-br from-foreground via-foreground to-primary/20 text-background overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-64 h-64 bg-primary rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Newsletter Section */}
        <div className="py-16 border-b border-background/10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 bg-primary/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-background">Stay Connected</span>
            </div>
            <h3 className="text-3xl md:text-4xl font-bold">Join Our Community Newsletter</h3>
            <p className="text-background/70 text-lg max-w-xl mx-auto">
              Get updates on community events, member stories, and important announcements.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 rounded-2xl bg-background/10 backdrop-blur-sm border border-background/20 text-background placeholder:text-background/50 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button variant="secondary" size="lg" className="gap-2 whitespace-nowrap">
                Subscribe
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
            {/* Company Info - Spans 2 columns on large screens */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-large">
                  <Users className="h-7 w-7 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Team No Struggle</h3>
                  <p className="text-sm text-background/60">Welfare Community</p>
                </div>
              </div>
              <p className="text-background/70 leading-relaxed max-w-md">
                Building stronger communities through mutual support and financial assistance. 
                Together, we ensure no one faces life's challenges alone.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-background/80">
                  <div className="h-10 w-10 rounded-xl bg-background/10 backdrop-blur-sm flex items-center justify-center">
                    <Heart className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <div className="font-semibold">3,500+ Families</div>
                    <div className="text-sm text-background/60">Supported since 2008</div>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex gap-3 pt-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="h-11 w-11 rounded-xl bg-background/10 backdrop-blur-sm border border-background/20 hover:bg-background/20 hover:border-background/40 flex items-center justify-center transition-all duration-200 hover:scale-110"
                  >
                    <social.icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-bold mb-6 flex items-center gap-2">
                <div className="h-1 w-8 bg-gradient-primary rounded-full"></div>
                Quick Links
              </h4>
              <ul className="space-y-3">
                {quickLinks.map((link) => (
                  <li key={link.name}>
                    <button
                      onClick={() => scrollToSection(link.href)}
                      className="text-background/70 hover:text-background transition-colors duration-200 text-sm flex items-center gap-2 group"
                    >
                      <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 -ml-5 group-hover:ml-0 transition-all" />
                      {link.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-lg font-bold mb-6 flex items-center gap-2">
                <div className="h-1 w-8 bg-gradient-secondary rounded-full"></div>
                Support
              </h4>
              <ul className="space-y-3">
                {supportLinks.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-background/70 hover:text-background transition-colors duration-200 text-sm flex items-center gap-2 group"
                    >
                      <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 -ml-5 group-hover:ml-0 transition-all" />
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-lg font-bold mb-6 flex items-center gap-2">
                <div className="h-1 w-8 bg-gradient-accent rounded-full"></div>
                Contact
              </h4>
              <div className="space-y-4">
                <a href="tel:+254712345678" className="flex items-start gap-3 text-background/70 hover:text-background transition-colors group">
                  <div className="h-9 w-9 rounded-lg bg-background/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0 group-hover:bg-background/20 transition-colors">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-background">Phone</div>
                    <div>+254 712 345 678</div>
                  </div>
                </a>
                <a href="mailto:info@teamnostruggle.org" className="flex items-start gap-3 text-background/70 hover:text-background transition-colors group">
                  <div className="h-9 w-9 rounded-lg bg-background/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0 group-hover:bg-background/20 transition-colors">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-background">Email</div>
                    <div>info@teamnostruggle.org</div>
                  </div>
                </a>
                <div className="flex items-start gap-3 text-background/70">
                  <div className="h-9 w-9 rounded-lg bg-background/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-background">Address</div>
                    <div>Nairobi, Kenya</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-background/10 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-background/60 text-sm">
              © {currentYear} Team No Struggle Welfare Group. All rights reserved.
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              {legalLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-background/60 hover:text-background transition-colors text-sm"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
