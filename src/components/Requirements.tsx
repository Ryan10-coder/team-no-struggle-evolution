import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Users, Calendar, MapPin, DollarSign } from 'lucide-react';

const Requirements = () => {
  const eligibilityRequirements = [
    {
      icon: Calendar,
      title: 'Age Requirement',
      description: '18 years and above - open to all adults',
      gradient: 'from-primary/20 to-secondary/20'
    },
    {
      icon: Users,
      title: 'Gender Inclusive',
      description: 'All genders welcome - no discrimination',
      gradient: 'from-secondary/20 to-accent/20'
    },
    {
      icon: MapPin,
      title: 'No Residence Boundaries',
      description: 'Open to members from any location or region',
      gradient: 'from-accent/20 to-primary/20'
    },
  ];

  const contributionRules = [
    {
      icon: DollarSign,
      title: 'Standard Contribution',
      description: 'Ksh 100 per bereavement occurrence for all members',
      gradient: 'from-secondary/20 to-accent/20'
    },
    {
      icon: Users,
      title: 'Children\'s Contribution',
      description: 'Ksh 50 for children below 10 years of age',
      gradient: 'from-accent/20 to-primary/20'
    },
    {
      icon: CheckCircle,
      title: 'Registration Fee',
      description: 'One-time Ksh 1000 administrative fee to join',
      gradient: 'from-primary/20 to-secondary/20'
    },
  ];

  return (
    <section id="requirements" className="py-24 bg-gradient-to-b from-background via-muted/20 to-background relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center mb-20">
          <div className="inline-block mb-4 px-4 py-2 bg-primary/10 backdrop-blur-sm rounded-full border border-primary/20">
            <span className="text-sm font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Join Our Community
            </span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Membership <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Requirements</span>
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Simple and inclusive eligibility criteria designed to welcome everyone who wants 
            to be part of our supportive community.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-16">
          {/* Eligibility Requirements */}
          <div>
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl mb-4 border border-primary/30">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                Who Can Join
              </h3>
            </div>
            <div className="space-y-6">
              {eligibilityRequirements.map((requirement, index) => {
                const Icon = requirement.icon;
                return (
                  <Card 
                    key={index} 
                    className="group relative overflow-hidden backdrop-blur-sm bg-card/50 border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-xl hover:-translate-y-1"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${requirement.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                    <CardContent className="p-8 relative z-10">
                      <div className="flex items-start gap-6">
                        <div className="relative">
                          <div className="absolute inset-0 bg-primary/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          <div className="relative w-14 h-14 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-primary/20">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors duration-300">
                            {requirement.title}
                          </h4>
                          <p className="text-muted-foreground leading-relaxed">{requirement.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Contribution Rules */}
          <div>
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-secondary/20 to-accent/20 rounded-2xl mb-4 border border-secondary/30">
                <DollarSign className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-secondary bg-clip-text text-transparent">
                Contribution Rules
              </h3>
            </div>
            <div className="space-y-6">
              {contributionRules.map((rule, index) => {
                const Icon = rule.icon;
                return (
                  <Card 
                    key={index} 
                    className="group relative overflow-hidden backdrop-blur-sm bg-card/50 border-border/50 hover:border-secondary/30 transition-all duration-500 hover:shadow-xl hover:-translate-y-1"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${rule.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                    <CardContent className="p-8 relative z-10">
                      <div className="flex items-start gap-6">
                        <div className="relative">
                          <div className="absolute inset-0 bg-secondary/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          <div className="relative w-14 h-14 bg-gradient-to-br from-secondary/10 to-accent/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-secondary/20">
                            <Icon className="h-6 w-6 text-secondary" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-foreground mb-2 group-hover:text-secondary transition-colors duration-300">
                            {rule.title}
                          </h4>
                          <p className="text-muted-foreground leading-relaxed">{rule.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Summary Box */}
        <div className="relative max-w-4xl mx-auto overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 backdrop-blur-sm border border-primary/20 p-10">
          <div className="absolute inset-0 bg-grid-white/5" />
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="group">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                18+
              </div>
              <div className="text-muted-foreground font-medium">Minimum Age</div>
            </div>
            <div className="group">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-secondary to-accent rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent mb-2">
                Ksh 100
              </div>
              <div className="text-muted-foreground font-medium">Per Contribution</div>
            </div>
            <div className="group">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-accent to-primary rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent mb-2">
                Ksh 1000
              </div>
              <div className="text-muted-foreground font-medium">Registration Fee</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Requirements;
