import { Card, CardContent } from '@/components/ui/card';
import { Shield, Vote, FileText, Users, AlertTriangle, UserX, Heart, Handshake, MessageSquare } from 'lucide-react';

const RightsResponsibilities = () => {
  const memberRights = [
    {
      icon: FileText,
      title: 'Access to Welfare Records',
      description: 'Full transparency and access to all welfare group records and financial information',
      gradient: 'from-primary/20 to-secondary/20'
    },
    {
      icon: Users,
      title: 'Participation in Decision-Making',
      description: 'Active participation in group decisions that affect the community and welfare policies',
      gradient: 'from-secondary/20 to-accent/20'
    },
    {
      icon: Vote,
      title: 'Voting in Group Elections',
      description: 'Right to vote in elections for leadership positions and important community matters',
      gradient: 'from-accent/20 to-primary/20'
    },
    {
      icon: Shield,
      title: 'Attendance at AGMs',
      description: 'Attendance and participation rights in Annual General Meetings and special assemblies',
      gradient: 'from-primary/20 to-secondary/20'
    },
  ];

  const dismissalConditions = [
    {
      icon: AlertTriangle,
      title: 'Fraud',
      description: 'Any fraudulent activities or misrepresentation of information',
      gradient: 'from-destructive/20 to-destructive/10'
    },
    {
      icon: UserX,
      title: 'Defaulting',
      description: 'Consistent failure to meet contribution obligations',
      gradient: 'from-destructive/20 to-destructive/10'
    },
    {
      icon: Users,
      title: 'Permanent Mental Illness',
      description: 'Permanent mental incapacity that prevents participation',
      gradient: 'from-destructive/20 to-destructive/10'
    },
    {
      icon: Shield,
      title: 'Death',
      description: 'Natural termination of membership upon death of member',
      gradient: 'from-destructive/20 to-destructive/10'
    },
  ];

  const communityResponsibilities = [
    { icon: Heart, text: 'Support fellow members' },
    { icon: Handshake, text: 'Contribute on time' },
    { icon: MessageSquare, text: 'Maintain open communication' },
    { icon: Shield, text: 'Uphold group values' },
    { icon: Users, text: 'Participate actively' },
    { icon: Vote, text: 'Attend meetings' },
  ];

  return (
    <section id="rights" className="py-24 bg-gradient-to-b from-background via-muted/20 to-background relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center mb-20">
          <div className="inline-block mb-4 px-4 py-2 bg-primary/10 backdrop-blur-sm rounded-full border border-primary/20">
            <span className="text-sm font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Member Guidelines
            </span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Rights & <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Responsibilities</span>
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Understanding your rights as a member and the conditions that govern 
            our community participation and welfare group membership.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20">
          {/* Member Rights */}
          <div>
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl mb-4 border border-primary/30">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                Your Rights as a Member
              </h3>
            </div>
            <div className="space-y-6">
              {memberRights.map((right, index) => {
                const Icon = right.icon;
                return (
                  <Card 
                    key={index} 
                    className="group relative overflow-hidden backdrop-blur-sm bg-card/50 border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-xl hover:-translate-y-1"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${right.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
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
                            {right.title}
                          </h4>
                          <p className="text-muted-foreground leading-relaxed">{right.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Dismissal Conditions */}
          <div>
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-destructive/20 to-destructive/10 rounded-2xl mb-4 border border-destructive/30">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-destructive bg-clip-text text-transparent">
                Dismissal Conditions
              </h3>
            </div>
            <div className="space-y-6">
              {dismissalConditions.map((condition, index) => {
                const Icon = condition.icon;
                return (
                  <Card 
                    key={index} 
                    className="group relative overflow-hidden backdrop-blur-sm bg-card/50 border-border/50 hover:border-destructive/30 transition-all duration-500 hover:shadow-xl hover:-translate-y-1"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${condition.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                    <CardContent className="p-8 relative z-10">
                      <div className="flex items-start gap-6">
                        <div className="relative">
                          <div className="absolute inset-0 bg-destructive/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          <div className="relative w-14 h-14 bg-gradient-to-br from-destructive/10 to-destructive/5 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-destructive/20">
                            <Icon className="h-6 w-6 text-destructive" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-foreground mb-2 group-hover:text-destructive transition-colors duration-300">
                            {condition.title}
                          </h4>
                          <p className="text-muted-foreground leading-relaxed">{condition.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Community Responsibilities */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 backdrop-blur-sm border border-primary/20 p-12">
          <div className="absolute inset-0 bg-grid-white/5" />
          <div className="relative z-10">
            <div className="text-center mb-12">
              <div className="inline-block mb-4 px-4 py-2 bg-background/50 backdrop-blur-sm rounded-full border border-primary/20">
                <span className="text-sm font-semibold text-primary">Our Commitment</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold mb-4">
                Community <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Responsibilities</span>
              </h3>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Together we build a stronger, more supportive community through shared values and responsibilities
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {communityResponsibilities.map((responsibility, index) => {
                const Icon = responsibility.icon;
                return (
                  <div
                    key={index}
                    className="group relative overflow-hidden backdrop-blur-sm bg-background/50 rounded-2xl p-6 border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-lg hover:-translate-y-1"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative z-10 flex flex-col items-center text-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-primary/20">
                        <Icon className="h-6 w-6 text-primary group-hover:text-secondary transition-colors duration-300" />
                      </div>
                      <span className="text-foreground font-semibold group-hover:text-primary transition-colors duration-300">
                        {responsibility.text}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RightsResponsibilities;