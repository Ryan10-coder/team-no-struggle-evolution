import { Button } from '@/components/ui/button';
import { Users, Heart, Shield, ArrowRight, Sparkles, TrendingUp, Award } from 'lucide-react';
import heroImage from '@/assets/hero-community.jpg';

const Hero = () => {
  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center bg-gradient-to-br from-background via-accent/30 to-background overflow-hidden pt-20">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-accent opacity-5 rounded-full blur-3xl"></div>
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-[0.02]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)',
        backgroundSize: '40px 40px'
      }}></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8 animate-fade-in">
            {/* Floating Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-primary/10 backdrop-blur-sm border border-primary/20 text-primary px-5 py-2.5 rounded-full text-sm font-semibold shadow-soft animate-scale-in">
              <Sparkles className="h-4 w-4" />
              <span>3,500+ Active Members & Growing</span>
            </div>

            {/* Main Heading with gradient */}
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight animate-slide-up">
                <span className="text-foreground">United in</span>
                <br />
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Community
                </span>
                <br />
                <span className="text-foreground">Support</span>
              </h1>
              <div className="h-1.5 w-24 bg-gradient-primary rounded-full"></div>
            </div>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl animate-slide-up" style={{animationDelay: '0.2s'}}>
              Join our thriving welfare community of over 3,500 members. 
              <span className="text-foreground font-semibold"> Together, we pool resources</span> to provide 
              essential financial support during life's most challenging moments.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 animate-slide-up" style={{animationDelay: '0.4s'}}>
              <Button 
                size="lg" 
                className="group"
                onClick={() => scrollToSection('#register')}
              >
                <Heart className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                Become a Member
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="glass" 
                size="lg" 
                onClick={() => scrollToSection('#about')}
              >
                <Shield className="h-5 w-5 mr-2" />
                Discover Our Mission
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap gap-6 pt-4 animate-fade-in" style={{animationDelay: '0.6s'}}>
              <div className="flex items-center gap-2 text-sm">
                <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                  <Award className="h-5 w-5 text-success" />
                </div>
                <div>
                  <div className="font-bold text-foreground">Est. 2008</div>
                  <div className="text-muted-foreground text-xs">15+ Years</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-bold text-foreground">3,500+</div>
                  <div className="text-muted-foreground text-xs">Members</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <div className="font-bold text-foreground">100%</div>
                  <div className="text-muted-foreground text-xs">Reliable</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Stats Cards */}
          <div className="relative animate-fade-in" style={{animationDelay: '0.3s'}}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Card 1 */}
              <div className="group relative bg-gradient-to-br from-card via-card to-primary/5 backdrop-blur-sm border border-border/50 rounded-3xl p-8 shadow-medium hover:shadow-large transition-all duration-300 hover:-translate-y-2">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>
                <div className="relative">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Users className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <div className="text-4xl font-bold text-foreground mb-2">3,500+</div>
                  <div className="text-muted-foreground font-medium">Active Members</div>
                  <div className="text-xs text-success mt-2 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Growing daily
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="group relative bg-gradient-to-br from-card via-card to-secondary/5 backdrop-blur-sm border border-border/50 rounded-3xl p-8 shadow-medium hover:shadow-large transition-all duration-300 hover:-translate-y-2 sm:mt-12">
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-2xl"></div>
                <div className="relative">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Heart className="h-7 w-7 text-secondary-foreground" />
                  </div>
                  <div className="text-4xl font-bold text-foreground mb-2">Ksh 300K</div>
                  <div className="text-muted-foreground font-medium">Maximum Payout</div>
                  <div className="text-xs text-primary mt-2">Per qualifying event</div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="group relative bg-gradient-to-br from-card via-card to-success/5 backdrop-blur-sm border border-border/50 rounded-3xl p-8 shadow-medium hover:shadow-large transition-all duration-300 hover:-translate-y-2">
                <div className="absolute top-0 right-0 w-32 h-32 bg-success/5 rounded-full blur-2xl"></div>
                <div className="relative">
                  <div className="h-14 w-14 rounded-2xl bg-success/20 border-2 border-success flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Shield className="h-7 w-7 text-success" />
                  </div>
                  <div className="text-4xl font-bold text-foreground mb-2">Ksh 100</div>
                  <div className="text-muted-foreground font-medium">Per Contribution</div>
                  <div className="text-xs text-success mt-2">Affordable support</div>
                </div>
              </div>

              {/* Card 4 */}
              <div className="group relative bg-gradient-to-br from-card via-card to-accent/20 backdrop-blur-sm border border-border/50 rounded-3xl p-8 shadow-medium hover:shadow-large transition-all duration-300 hover:-translate-y-2 sm:mt-12">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-2xl"></div>
                <div className="relative">
                  <div className="h-14 w-14 rounded-2xl bg-accent/50 border-2 border-primary/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Award className="h-7 w-7 text-primary" />
                  </div>
                  <div className="text-4xl font-bold text-foreground mb-2">15+</div>
                  <div className="text-muted-foreground font-medium">Years of Service</div>
                  <div className="text-xs text-primary mt-2">Since 2008</div>
                </div>
              </div>
            </div>

            {/* Decorative Image */}
            <div className="absolute -bottom-8 -right-8 w-64 h-64 opacity-5 pointer-events-none">
              <img
                src={heroImage}
                alt=""
                className="w-full h-full object-cover rounded-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modern Scroll Indicator */}
      <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
        <div className="text-xs text-muted-foreground font-medium">Scroll to explore</div>
        <div className="w-0.5 h-12 bg-gradient-to-b from-primary to-transparent rounded-full"></div>
      </div>
    </section>
  );
};

export default Hero;