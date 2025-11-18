import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, User, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const navigation = [
    { name: 'About Us', href: '#about' },
    { name: 'Requirements', href: '#requirements' },
    { name: 'Rights & Responsibilities', href: '#rights' },
    { name: 'Register as a Member', href: '#register' },
    { name: 'Register as an Admin', href: '/adminregistration', route: true },
    { name: user ? 'Dashboard' : 'Staff Portal', href: user ? '/dashboard' : '/auth', route: true },
    { name: 'Portal Login', href: '/portal-login', route: true }
  ];

  const handleNavigation = (item: { href: string; route?: boolean }) => {
    if (item.route) {
      navigate(item.href);
    } else {
      const element = document.querySelector(item.href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setIsMenuOpen(false);
  };

  return (
    <header className="fixed w-full top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-soft">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          {/* Logo - Modern Design */}
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-lg group-hover:opacity-30 transition-opacity rounded-full"></div>
              <img 
                src="/lovable-uploads/4a4961c3-bc53-48f7-a650-4dc70fb40614.png" 
                alt="Itumbu Welfare" 
                className="h-14 w-auto relative z-10 group-hover:scale-105 transition-transform"
              />
            </div>
            <div>
              <h4 className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">
                Itumbu Welfare
              </h4>
              <p className="text-xs text-muted-foreground">Welfare Community</p>
            </div>
          </div>

          {/* Desktop Navigation - Pill Style */}
          <nav className="hidden lg:flex items-center gap-2 bg-muted/50 backdrop-blur-sm rounded-full px-3 py-2 border border-border/50">
            {navigation.slice(0, 4).map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavigation(item)}
                className="px-4 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-background transition-all duration-200"
              >
                {item.name}
              </button>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="relative group">
              <Button 
                variant="ghost" 
                size="sm"
                className="gap-2"
              >
                More
                <ChevronDown className="h-4 w-4" />
              </Button>
              {/* Dropdown Menu */}
              <div className="absolute top-full right-0 mt-2 w-56 bg-card backdrop-blur-xl border border-border/50 rounded-2xl shadow-large opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden">
                {navigation.slice(4).map((item, index) => (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item)}
                    className="w-full text-left px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
            
            <Button 
              size="sm" 
              onClick={() => handleNavigation({ href: '#register' })}
              className="gap-2"
            >
              <User className="h-4 w-4" />
              Join Now
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2.5 rounded-xl hover:bg-accent/50 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation - Slide Down */}
        <div className={`lg:hidden overflow-hidden transition-all duration-300 ${isMenuOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="py-6 space-y-2">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavigation(item)}
                className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200"
              >
                {item.name}
              </button>
            ))}
            <div className="pt-4 px-4">
              <Button 
                size="sm" 
                onClick={() => handleNavigation({ href: '#register' })}
                className="w-full gap-2"
              >
                <User className="h-4 w-4" />
                Join Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
