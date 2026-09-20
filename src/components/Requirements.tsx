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
      className="relative bg-background py-20 sm:py-24 lg:py-28"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mx-auto mb-16 max-w-3xl text-center lg:mb-20">

          <div className="mb-6 inline-flex items-center gap-2">
            <span className="h-px w-8 bg-primary" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Membership
            </span>
            <span className="h-px w-8 bg-primary" />
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Membership Requirements
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Everything you need to know about eligibility, membership
            contributions and registration before joining Itumbu Welfare.
          </p>
        </div>

        {/* Main Sections */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">

          {/* ============================================
              WHO CAN JOIN
          ============================================= */}
          <div>

            {/* Section Heading */}
            <div className="mb-8 flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <Users className="h-6 w-6" />
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary">
                  Eligibility
                </p>

                <h3 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Who Can Join
                </h3>
              </div>
            </div>

            {/* Eligibility Cards */}
            <div className="space-y-4">
              {eligibilityRequirements.map((requirement, index) => {
                const Icon = requirement.icon;

                return (
                  <Card
                    key={index}
                    className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-none transition-all duration-300 hover:border-primary/40 hover:shadow-md"
                  >
                    {/* Accent Line */}
                    <div className="absolute left-0 top-0 h-full w-1 bg-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                    <CardContent className="p-0">
                      <div className="flex items-center gap-5 p-5 sm:p-6">

                        {/* Number */}
                        <div className="hidden shrink-0 text-sm font-bold text-muted-foreground/40 sm:block">
                          0{index + 1}
                        </div>

                        {/* Icon */}
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                          <Icon className="h-5 w-5" />
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <h4 className="text-base font-semibold text-foreground sm:text-lg">
                            {requirement.title}
                          </h4>

                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {requirement.description}
                          </p>
                        </div>

                        {/* Status */}
                        <CheckCircle className="hidden h-5 w-5 shrink-0 text-primary/50 sm:block" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>


          {/* ============================================
              CONTRIBUTION RULES
          ============================================= */}
          <div>

            {/* Section Heading */}
            <div className="mb-8 flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground shadow-sm">
                <DollarSign className="h-6 w-6" />
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-secondary">
                  Contributions
                </p>

                <h3 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Contribution Rules
                </h3>
              </div>
            </div>

            {/* Contribution Cards */}
            <div className="space-y-4">
              {contributionRules.map((rule, index) => {
                const Icon = rule.icon;

                return (
                  <Card
                    key={index}
                    className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-none transition-all duration-300 hover:border-secondary/40 hover:shadow-md"
                  >
                    {/* Accent Line */}
                    <div className="absolute left-0 top-0 h-full w-1 bg-secondary opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                    <CardContent className="p-0">
                      <div className="flex items-center gap-5 p-5 sm:p-6">

                        {/* Number */}
                        <div className="hidden shrink-0 text-sm font-bold text-muted-foreground/40 sm:block">
                          0{index + 1}
                        </div>

                        {/* Icon */}
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary transition-colors duration-300 group-hover:bg-secondary group-hover:text-secondary-foreground">
                          <Icon className="h-5 w-5" />
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <h4 className="text-base font-semibold text-foreground sm:text-lg">
                            {rule.title}
                          </h4>

                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {rule.description}
                          </p>
                        </div>

                        {/* Status */}
                        <CheckCircle className="hidden h-5 w-5 shrink-0 text-secondary/50 sm:block" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>


        {/* ============================================
            MEMBERSHIP AT A GLANCE
        ============================================= */}
        <div className="mt-16 lg:mt-20">

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">

            {/* Header */}
            <div className="flex flex-col gap-2 border-b border-border bg-muted/20 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">

              <div>
                <h3 className="text-lg font-bold text-foreground">
                  Membership at a glance
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  Key figures to remember when joining the welfare.
                </p>
              </div>

              <div className="hidden h-2 w-2 rounded-full bg-primary sm:block" />
            </div>


            {/* Statistics */}
            <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">

              {/* Age */}
              <div className="group px-6 py-7 sm:px-8 sm:py-8">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Calendar className="h-5 w-5" />
                  </div>

                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Eligibility
                  </span>
                </div>

                <div className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  18+
                </div>

                <p className="mt-1 text-sm font-medium text-muted-foreground">
                  Minimum Age
                </p>
              </div>


              {/* Contribution */}
              <div className="group px-6 py-7 sm:px-8 sm:py-8">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                    <DollarSign className="h-5 w-5" />
                  </div>

                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Contribution
                  </span>
                </div>

                <div className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Ksh 100
                </div>

                <p className="mt-1 text-sm font-medium text-muted-foreground">
                  Per Bereavement Contribution
                </p>
              </div>


              {/* Registration */}
              <div className="group px-6 py-7 sm:px-8 sm:py-8">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent-foreground">
                    <CheckCircle className="h-5 w-5" />
                  </div>

                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Registration
                  </span>
                </div>

                <div className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Ksh 1000
                </div>

                <p className="mt-1 text-sm font-medium text-muted-foreground">
                  One-Time Registration Fee
                </p>
              </div>

            </div>
          </div>
        </div>


        {/* Bottom Note */}
        <div className="mx-auto mt-8 flex max-w-3xl items-start gap-3 rounded-lg border border-border/70 bg-muted/20 px-5 py-4">
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />

          <p className="text-sm leading-6 text-muted-foreground">
            Membership is open to eligible adults regardless of gender or
            location. Contributions help members support one another during
            times of bereavement.
          </p>
        </div>

      </div>
    </section>
  );
};

export default Requirements;
