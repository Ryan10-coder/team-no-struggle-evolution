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
    <header className="fixed top-0 left-0 w-full z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[76px]">

          {/* Brand */}
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-11 h-11 rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors duration-300"></div>

              <img
                src="/lovable-uploads/"
                alt=""
                className="h-11 w-auto relative z-10 object-contain group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            <div className="leading-tight">
              <h4 className="text-[17px] font-extrabold tracking-[-0.02em] text-foreground">
                Itumbu Welfare
              </h4>
              <p className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase">
                Welfare Community
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center ml-auto mr-8">
            <div className="flex items-center gap-1">

              {navigation.slice(0, 4).map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item)}
                  className="
                    relative px-3.5 py-2.5
                    text-[13px] font-semibold
                    text-muted-foreground
                    rounded-lg
                    transition-all duration-200
                    hover:text-foreground
                    hover:bg-muted
                    group
                  "
                >
                  {item.name}

                  <span className="
                    absolute left-3.5 right-3.5 bottom-1
                    h-[2px]
                    rounded-full
                    bg-primary
                    scale-x-0
                    group-hover:scale-x-100
                    transition-transform duration-200 origin-center
                  " />
                </button>
              ))}

            </div>
          </nav>

          {/* Right Actions */}
          <div className="hidden lg:flex items-center gap-2.5">

            {/* More Navigation */}
            <div className="relative group">
              <Button
                variant="ghost"
                size="sm"
                className="
                  h-10 px-3.5
                  gap-1.5
                  rounded-lg
                  text-[13px]
                  font-semibold
                  text-muted-foreground
                  hover:text-foreground
                  hover:bg-muted
                "
              >
                More
                <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-180" />
              </Button>

              {/* Dropdown */}
              <div className="
                absolute top-[calc(100%+10px)] right-0
                w-64
                bg-card
                border border-border
                rounded-xl
                shadow-xl
                opacity-0 invisible
                translate-y-1
                group-hover:opacity-100
                group-hover:visible
                group-hover:translate-y-0
                transition-all duration-200
                overflow-hidden
              ">

                <div className="px-4 pt-4 pb-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    Quick Access
                  </p>
                </div>

                <div className="px-2 pb-2">
                  {navigation.slice(4).map((item) => (
                    <button
                      key={item.name}
                      onClick={() => handleNavigation(item)}
                      className="
                        w-full
                        flex items-center
                        px-3 py-2.5
                        text-left
                        text-[13px]
                        font-medium
                        text-muted-foreground
                        rounded-lg
                        hover:text-foreground
                        hover:bg-muted
                        transition-colors duration-150
                      "
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Join Button */}
            <Button
              size="sm"
              onClick={() => handleNavigation({ href: '#register' })}
              className="
                h-10
                px-4
                gap-2
                rounded-lg
                text-[13px]
                font-bold
                shadow-sm
                hover:shadow-md
                transition-all duration-200
              "
            >
              <User className="h-4 w-4" />
              Join Now
            </Button>

          </div>

          {/* Mobile Menu Button */}
          <button
            className="
              lg:hidden
              flex items-center justify-center
              w-10 h-10
              rounded-lg
              border border-border
              bg-background
              text-foreground
              hover:bg-muted
              transition-all duration-200
            "
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>

        </div>

        {/* Mobile Navigation */}
        <div
          className={`
            lg:hidden
            overflow-hidden
            transition-all duration-300 ease-out
            ${isMenuOpen
              ? 'max-h-[620px] opacity-100 border-t border-border'
              : 'max-h-0 opacity-0'
            }
          `}
        >
          <div className="py-4">

            <div className="space-y-1">
              {navigation.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item)}
                  className="
                    w-full
                    flex items-center
                    text-left
                    px-4 py-3
                    rounded-lg
                    text-[14px]
                    font-semibold
                    text-muted-foreground
                    hover:text-foreground
                    hover:bg-muted
                    transition-all duration-200
                  "
                >
                  {item.name}
                </button>
              ))}
            </div>

            <div className="pt-4 mt-3 border-t border-border">
              <Button
                size="sm"
                onClick={() => handleNavigation({ href: '#register' })}
                className="
                  w-full
                  h-11
                  gap-2
                  rounded-lg
                  font-bold
                  shadow-sm
                "
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

