import { Card, CardContent } from '@/components/ui/card';
import { Users, Heart, Shield, Target, Award, Globe } from 'lucide-react';

const About = () => {
  const features = [
    {
      icon: Heart,
      title: 'Contribution Model',
      description: 'Each member contributes Ksh 100 per occurrence (Ksh 50 for children under 10) to support families in need.',
      gradient: 'from-primary/20 to-secondary/20'
    },
    {
      icon: Shield,
      title: 'Guaranteed Payouts after achieving the registration membership target',
      description: 'Up to Ksh 300,000 for principal members, spouses and parents; Ksh 150,000 for children under 10.',
      gradient: 'from-secondary/20 to-accent/20'
    },
    {
      icon: Users,
      title: 'Open Membership',
      description: 'Anyone 18+, any gender, no residence boundaries. Join our inclusive community of 3,500+ members.',
      gradient: 'from-accent/20 to-primary/20'
    },
    {
      icon: Target,
      title: 'Pooled Support',
      description: 'Small contributions from many members create a powerful safety net for all families.',
      gradient: 'from-primary/20 to-secondary/20'
    },
    {
      icon: Award,
      title: 'Administrative Fee',
      description: 'One-time Ksh 1000 registration fee to join and become part of our supportive community.',
      gradient: 'from-secondary/20 to-accent/20'
    },
    {
      icon: Globe,
      title: 'Wide Coverage',
      description: 'Supporting members and their families across all regions with no geographical restrictions.',
      gradient: 'from-accent/20 to-primary/20'
    },
  ];

  return (
    <section id="about" className="py-24 bg-gradient-to-b from-background via-muted/30 to-background relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center mb-20">
          <div className="inline-block mb-4 px-4 py-2 bg-primary/10 backdrop-blur-sm rounded-full border border-primary/20">
            <span className="text-sm font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              About Our Community
            </span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
            About <span className="text-primary">Team No Struggle</span>
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Team No Struggle is a benevolent welfare group targeting 3,500+ members. We operate through 
            a pooled support system where members contribute small amounts to collectively support families 
            during difficult times, particularly with funeral expenses and related needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="group relative overflow-hidden backdrop-blur-sm bg-card/50 border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-xl hover:-translate-y-1"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <CardContent className="p-8 relative z-10">
                  <div className="mb-6 relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500" />
                    <div className="relative w-16 h-16 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-primary/20">
                      <Icon className="h-7 w-7 text-primary group-hover:text-secondary transition-colors duration-300" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Our Team in Action Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <div className="inline-block mb-4 px-4 py-2 bg-secondary/10 backdrop-blur-sm rounded-full border border-secondary/20">
              <span className="text-sm font-semibold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
                Community Gallery
              </span>
            </div>
            <h3 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Our Team in <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Action</span>
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-3xl shadow-lg ring-1 ring-border/50 group-hover:ring-primary/50 transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
                <img 
                  src="/lovable-uploads/2b896dec-cf05-49e1-adf4-2812daf80b94.png" 
                  alt="Team No Struggle members gathering together for community support" 
                  className="w-full h-72 object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 z-20 transform translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                  <p className="text-white font-semibold text-lg">Our dedicated team members</p>
                </div>
              </div>
            </div>
            <div className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-3xl shadow-lg ring-1 ring-border/50 group-hover:ring-primary/50 transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
                <img 
                  src="/lovable-uploads/72c12052-4bfc-47e0-83da-a8ab3a74fc60.png" 
                  alt="Team No Struggle community volunteers in their signature uniforms" 
                  className="w-full h-72 object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 z-20 transform translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                  <p className="text-white font-semibold text-lg">Community volunteers united</p>
                </div>
              </div>
            </div>
            <div className="group cursor-pointer md:col-span-2 lg:col-span-1">
              <div className="relative overflow-hidden rounded-3xl shadow-lg ring-1 ring-border/50 group-hover:ring-primary/50 transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
                <img 
                  src="/lovable-uploads/5799a3f3-3192-499e-9b94-50df16c3444a.png" 
                  alt="Team No Struggle members providing support and care to community members in need" 
                  className="w-full h-72 object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 z-20 transform translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                  <p className="text-white font-semibold text-lg">Supporting those in need</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 backdrop-blur-sm border border-primary/20 p-12 md:p-16">
          <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
            <div>
              <div className="inline-block mb-4 px-4 py-2 bg-background/50 backdrop-blur-sm rounded-full border border-primary/20">
                <span className="text-sm font-semibold text-primary">How It Works</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                How Our Pooled Support <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Works</span>
              </h3>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                Our benevolent welfare system operates on the principle of collective responsibility. 
                When a member or their family faces a bereavement, our community comes together to 
                provide immediate financial support through our pooled contribution system.
              </p>
              <div className="space-y-4">
                {[
                  'Ksh 100 contribution per occurrence',
                  'Ksh 50 for children under 10',
                  'Ksh 1000 one-time registration fee',
                  'Transparent community-driven process'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-background/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-colors duration-300">
                    <div className="w-2 h-2 bg-gradient-to-r from-primary to-secondary rounded-full animate-pulse" />
                    <span className="text-foreground font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="lg:text-right">
              <div className="inline-block bg-background/80 backdrop-blur-md rounded-3xl p-10 shadow-xl border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-2xl">
                <div className="space-y-8">
                  <div className="group">
                    <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">
                      3,500+
                    </div>
                    <div className="text-muted-foreground font-medium">Target Members</div>
                  </div>
                  <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                  <div className="group">
                    <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">
                      Ksh 300K
                    </div>
                    <div className="text-muted-foreground font-medium">Max Payout</div>
                  </div>
                  <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                  <div className="group">
                    <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">
                      Ksh 1000
                    </div>
                    <div className="text-muted-foreground font-medium">Registration Fee</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
