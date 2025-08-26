import { Card, CardContent } from '@/components/ui/card';
import { Users, Heart, Shield, Target, Award, Globe } from 'lucide-react';

const About = () => {
  const features = [
    {
      icon: Heart,
      title: 'Community Support',
      description: 'Providing financial assistance during medical emergencies, natural disasters, and family crises.',
    },
    {
      icon: Shield,
      title: 'Reliable Protection',
      description: 'Trusted support system with transparent processes and guaranteed assistance when you need it most.',
    },
    {
      icon: Users,
      title: 'Strong Network',
      description: 'Building lasting relationships and connections within our diverse community of caring members.',
    },
    {
      icon: Target,
      title: 'Focused Mission',
      description: 'Dedicated to reducing financial stress and ensuring no member faces hardship alone.',
    },
    {
      icon: Award,
      title: 'Proven Track Record',
      description: 'Years of successful community support with thousands of families helped through difficult times.',
    },
    {
      icon: Globe,
      title: 'Growing Reach',
      description: 'Expanding our impact across communities while maintaining our core values of trust and support.',
    },
  ];

  return (
    <section id="about" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            About <span className="text-primary">Team No Struggle</span>
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Founded on the principle that no one should face life's struggles alone, Team No Struggle 
            is a welfare group dedicated to providing financial support and community assistance during 
            times of need. Our mission is to create a safety net of mutual support where every member 
            contributes to and benefits from our collective strength.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="group hover:shadow-medium transition-all duration-300 border-border/50 hover:border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">{feature.title}</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl p-8 md:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Our Commitment to You
              </h3>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                We believe that everyone deserves support during their most challenging moments. 
                Through our welfare group, we've created a system where community members pool 
                resources to help each other through medical emergencies, family crises, and 
                unexpected financial hardships.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-foreground">Transparent contribution system</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-foreground">Quick assistance approval process</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-foreground">24/7 member support</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-foreground">Community-driven decision making</span>
                </li>
              </ul>
            </div>
            <div className="lg:text-right">
              <div className="inline-block bg-white rounded-2xl p-8 shadow-soft">
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">15+</div>
                <div className="text-muted-foreground mb-4">Years of Service</div>
                <div className="text-4xl md:text-5xl font-bold text-secondary mb-2">100%</div>
                <div className="text-muted-foreground mb-4">Assistance Success Rate</div>
                <div className="text-4xl md:text-5xl font-bold text-success mb-2">3.5K+</div>
                <div className="text-muted-foreground">Families Supported</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;