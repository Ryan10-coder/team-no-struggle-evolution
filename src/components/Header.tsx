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
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">

        <div className="h-[74px] flex items-center justify-between">

          {/* ================= BRAND ================= */}
          <div className="flex items-center gap-3 cursor-pointer min-w-fit">

            <div className="h-11 w-11 flex items-center justify-center">
              <img
                src="/lovable-uploads/itumbuwelfare.png"
                alt="Itumbu Welfare"
                className="h-10 w-auto object-contain"
              />
            </div>

            <div className="hidden sm:block leading-none">
              <h4 className="text-[17px] font-bold text-foreground tracking-tight">
                Itumbu Welfare
              </h4>

              <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Welfare Community
              </p>
            </div>

          </div>


          {/* ================= DESKTOP NAVIGATION ================= */}
          <nav className="hidden lg:flex items-center h-full">

            {navigation.slice(0, 4).map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavigation(item)}
                className="
                  relative
                  h-[74px]
                  px-4
                  text-[13px]
                  font-medium
                  text-muted-foreground
                  hover:text-foreground
                  transition-colors
                  group
                "
              >

                {item.name}

                <span
                  className="
                    absolute
                    left-4
                    right-4
                    bottom-0
                    h-[2px]
                    bg-primary
                    scale-x-0
                    group-hover:scale-x-100
                    transition-transform
                    duration-200
                    origin-center
                  "
                />

              </button>
            ))}

          </nav>


          {/* ================= RIGHT SIDE ================= */}
          <div className="hidden lg:flex items-center gap-2 min-w-fit">

            {/* More */}
            <div className="relative group">

              <Button
                variant="ghost"
                size="sm"
                className="
                  h-9
                  px-3
                  rounded-md
                  text-[13px]
                  font-medium
                  text-muted-foreground
                  hover:text-foreground
                  hover:bg-muted
                  gap-1
                "
              >
                More

                <ChevronDown
                  className="
                    h-3.5
                    w-3.5
                    transition-transform
                    duration-200
                    group-hover:rotate-180
                  "
                />
              </Button>


              {/* Dropdown */}
              <div
                className="
                  absolute
                  top-full
                  right-0
                  mt-2
                  w-60
                  bg-card
                  border
                  border-border
                  rounded-lg
                  shadow-lg
                  opacity-0
                  invisible
                  translate-y-1
                  group-hover:opacity-100
                  group-hover:visible
                  group-hover:translate-y-0
                  transition-all
                  duration-150
                  overflow-hidden
                "
              >

                <div className="px-4 py-3 border-b border-border">

                  <p className="text-xs font-semibold text-foreground">
                    Account & Portal
                  </p>

                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Access additional services
                  </p>

                </div>


                <div className="p-1.5">

                  {navigation.slice(4).map((item) => (
                    <button
                      key={item.name}
                      onClick={() => handleNavigation(item)}
                      className="
                        w-full
                        text-left
                        px-3
                        py-2.5
                        rounded-md
                        text-[13px]
                        font-medium
                        text-muted-foreground
                        hover:text-foreground
                        hover:bg-muted
                        transition-colors
                      "
                    >
                      {item.name}
                    </button>
                  ))}

                </div>

              </div>

            </div>


            {/* Divider */}
            <div className="h-7 w-px bg-border mx-1" />


            {/* Join */}
            <Button
              size="sm"
              onClick={() => handleNavigation({ href: '#register' })}
              className="
                h-9
                px-4
                rounded-md
                gap-2
                text-[13px]
                font-semibold
                shadow-none
              "
            >
              <User className="h-3.5 w-3.5" />
              Join Now
            </Button>

          </div>


          {/* ================= MOBILE BUTTON ================= */}
          <button
            className="
              lg:hidden
              h-10
              w-10
              flex
              items-center
              justify-center
              rounded-md
              border
              border-border
              bg-background
              text-foreground
              hover:bg-muted
              transition-colors
            "
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle navigation"
          >

            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}

          </button>

        </div>


        {/* ================= MOBILE NAVIGATION ================= */}
        <div
          className={`
            lg:hidden
            overflow-hidden
            transition-all
            duration-200
            ease-in-out
            ${isMenuOpen
              ? 'max-h-[650px] opacity-100 border-t border-border'
              : 'max-h-0 opacity-0'
            }
          `}
        >

          <div className="py-3">

            {/* Mobile links */}
            <nav className="space-y-0.5">

              {navigation.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item)}
                  className="
                    w-full
                    flex
                    items-center
                    justify-between
                    px-4
                    py-3
                    rounded-md
                    text-left
                    text-[14px]
                    font-medium
                    text-muted-foreground
                    hover:text-foreground
                    hover:bg-muted
                    transition-colors
                  "
                >
                  <span>{item.name}</span>

                  <span className="text-muted-foreground/50">
                    →
                  </span>

                </button>
              ))}

            </nav>


            {/* Mobile CTA */}
            <div className="mt-3 pt-3 border-t border-border">

              <Button
                size="sm"
                onClick={() => handleNavigation({ href: '#register' })}
                className="
                  w-full
                  h-11
                  rounded-md
                  gap-2
                  font-semibold
                  shadow-none
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

