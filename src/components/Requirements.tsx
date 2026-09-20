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
    <section
      id="requirements"
      className="relative overflow-hidden bg-background py-16 sm:py-20 lg:py-24"
    >
      {/* Subtle background decoration */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-secondary/5 blur-3xl" />

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="mx-auto mb-14 max-w-3xl text-center lg:mb-16">
          <div className="mb-5 inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-4 py-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-primary sm:text-sm">
              Membership Information
            </span>
          </div>

          <h2 className="mb-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Membership{' '}
            <span className="text-primary">
              Requirements
            </span>
          </h2>

          <p className="mx-auto max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Simple and inclusive eligibility criteria designed to welcome
            everyone who wants to be part of our supportive community.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12">

          {/* Eligibility Requirements */}
          <div>
            <div className="mb-7 flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10">
                <Users className="h-6 w-6" />
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">
                  Eligibility
                </p>

                <h3 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Who Can Join
                </h3>
              </div>
            </div>

            <div className="space-y-4">
              {eligibilityRequirements.map((requirement, index) => {
                const Icon = requirement.icon;

                return (
                  <Card
                    key={index}
                    className="group overflow-hidden rounded-2xl border-border/70 bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                  >
                    <CardContent className="p-5 sm:p-6">
                      <div className="flex items-start gap-4 sm:gap-5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                          <Icon className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="mb-1.5 text-base font-semibold text-foreground sm:text-lg">
                            {requirement.title}
                          </h4>

                          <p className="text-sm leading-6 text-muted-foreground sm:text-base">
                            {requirement.description}
                          </p>
                        </div>

                        <CheckCircle className="mt-1 hidden h-5 w-5 shrink-0 text-primary/50 sm:block" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Contribution Rules */}
          <div>
            <div className="mb-7 flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary ring-1 ring-secondary/10">
                <DollarSign className="h-6 w-6" />
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-secondary">
                  Financial Guidelines
                </p>

                <h3 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Contribution Rules
                </h3>
              </div>
            </div>

            <div className="space-y-4">
              {contributionRules.map((rule, index) => {
                const Icon = rule.icon;

                return (
                  <Card
                    key={index}
                    className="group overflow-hidden rounded-2xl border-border/70 bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-secondary/30 hover:shadow-md"
                  >
                    <CardContent className="p-5 sm:p-6">
                      <div className="flex items-start gap-4 sm:gap-5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary transition-colors duration-300 group-hover:bg-secondary group-hover:text-secondary-foreground">
                          <Icon className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="mb-1.5 text-base font-semibold text-foreground sm:text-lg">
                            {rule.title}
                          </h4>

                          <p className="text-sm leading-6 text-muted-foreground sm:text-base">
                            {rule.description}
                          </p>
                        </div>

                        <CheckCircle className="mt-1 hidden h-5 w-5 shrink-0 text-secondary/50 sm:block" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Summary Box */}
        <div className="mx-auto mt-12 max-w-5xl lg:mt-16">
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
            <div className="border-b border-border/60 bg-muted/30 px-5 py-4 sm:px-6">
              <h3 className="text-base font-semibold text-foreground sm:text-lg">
                Membership at a glance
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Key figures to keep in mind before joining.
              </p>
            </div>

            <div className="grid grid-cols-1 divide-y divide-border/60 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              
              {/* Minimum Age */}
              <div className="group flex items-center gap-4 p-5 sm:block sm:p-7 sm:text-center">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:mx-auto sm:mb-4">
                  <Calendar className="h-5 w-5" />
                </div>

                <div>
                  <div className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    18+
                  </div>

                  <div className="mt-1 text-sm font-medium text-muted-foreground">
                    Minimum Age
                  </div>
                </div>
              </div>

              {/* Contribution */}
              <div className="group flex items-center gap-4 p-5 sm:block sm:p-7 sm:text-center">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary sm:mx-auto sm:mb-4">
                  <DollarSign className="h-5 w-5" />
                </div>

                <div>
                  <div className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    Ksh 100
                  </div>

                  <div className="mt-1 text-sm font-medium text-muted-foreground">
                    Per Contribution
                  </div>
                </div>
              </div>

              {/* Registration */}
              <div className="group flex items-center gap-4 p-5 sm:block sm:p-7 sm:text-center">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent-foreground sm:mx-auto sm:mb-4">
                  <CheckCircle className="h-5 w-5" />
                </div>

                <div>
                  <div className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    Ksh 1000
                  </div>

                  <div className="mt-1 text-sm font-medium text-muted-foreground">
                    Registration Fee
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

export default Requirements;
