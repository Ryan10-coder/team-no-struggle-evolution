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
      className="bg-background py-20 sm:py-24 lg:py-32"
    >
      <div className="container mx-auto px-5 sm:px-8 lg:px-12">

        {/* INTRO */}
        <div className="grid grid-cols-1 gap-8 border-b border-border pb-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20 lg:pb-16">

          <div>
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Membership
            </p>

            <h2 className="max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-0.035em] text-foreground sm:text-5xl lg:text-6xl">
              Simple requirements.
              <br />
              <span className="text-muted-foreground">
                Meaningful support.
              </span>
            </h2>
          </div>

          <div className="flex items-end">
            <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              Itumbu Welfare is open to adults who want to be part of a
              community that supports its members during times of bereavement.
              Membership is straightforward, inclusive and accessible.
            </p>
          </div>
        </div>


        {/* REQUIREMENTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2">

          {/* ELIGIBILITY */}
          <div className="border-b border-border py-12 lg:border-b-0 lg:border-r lg:pr-12 lg:py-16">

            <div className="mb-10">
              <span className="text-sm font-medium text-muted-foreground">
                01
              </span>

              <h3 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Who can join
              </h3>

              <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                Our membership requirements are designed to keep the welfare
                open and accessible to everyone who qualifies.
              </p>
            </div>

            <div>
              {eligibilityRequirements.map((requirement, index) => {
                const Icon = requirement.icon;

                return (
                  <div
                    key={index}
                    className="group flex gap-5 border-t border-border py-6 transition-colors duration-200 hover:bg-muted/30 sm:gap-6"
                  >
                    <div className="w-8 shrink-0 pt-1 text-xs font-semibold text-muted-foreground">
                      0{index + 1}
                    </div>

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center text-primary">
                      <Icon className="h-5 w-5 stroke-[1.7]" />
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-base font-semibold text-foreground">
                        {requirement.title}
                      </h4>

                      <p className="mt-1.5 max-w-md text-sm leading-6 text-muted-foreground">
                        {requirement.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>


          {/* CONTRIBUTIONS */}
          <div className="py-12 lg:pl-12 lg:py-16">

            <div className="mb-10">
              <span className="text-sm font-medium text-muted-foreground">
                02
              </span>

              <h3 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Contributions
              </h3>

              <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                Members contribute according to the welfare's established
                guidelines and the circumstances involved.
              </p>
            </div>

            <div>
              {contributionRules.map((rule, index) => {
                const Icon = rule.icon;

                return (
                  <div
                    key={index}
                    className="group flex gap-5 border-t border-border py-6 transition-colors duration-200 hover:bg-muted/30 sm:gap-6"
                  >
                    <div className="w-8 shrink-0 pt-1 text-xs font-semibold text-muted-foreground">
                      0{index + 1}
                    </div>

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center text-secondary">
                      <Icon className="h-5 w-5 stroke-[1.7]" />
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-base font-semibold text-foreground">
                        {rule.title}
                      </h4>

                      <p className="mt-1.5 max-w-md text-sm leading-6 text-muted-foreground">
                        {rule.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>


        {/* KEY FIGURES */}
        <div className="mt-4 border-y border-border">

          <div className="grid grid-cols-1 sm:grid-cols-3">

            {/* AGE */}
            <div className="border-b border-border px-6 py-8 sm:border-b-0 sm:border-r sm:px-8 lg:px-10">
              <div className="mb-8 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  Eligibility
                </span>

                <Calendar className="h-4 w-4 text-primary" />
              </div>

              <div className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                18+
              </div>

              <p className="mt-2 text-sm text-muted-foreground">
                Minimum membership age
              </p>
            </div>


            {/* CONTRIBUTION */}
            <div className="border-b border-border px-6 py-8 sm:border-b-0 sm:border-r sm:px-8 lg:px-10">
              <div className="mb-8 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  Bereavement
                </span>

                <DollarSign className="h-4 w-4 text-secondary" />
              </div>

              <div className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                Ksh 100
              </div>

              <p className="mt-2 text-sm text-muted-foreground">
                Standard member contribution
              </p>
            </div>


            {/* REGISTRATION */}
            <div className="px-6 py-8 sm:px-8 lg:px-10">
              <div className="mb-8 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  Registration
                </span>

                <CheckCircle className="h-4 w-4 text-primary" />
              </div>

              <div className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                Ksh 1000
              </div>

              <p className="mt-2 text-sm text-muted-foreground">
                One-time registration fee
              </p>
            </div>

          </div>
        </div>


        {/* FOOTNOTE */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <p className="max-w-2xl text-xs leading-5 text-muted-foreground sm:text-sm">
            Contributions are made in accordance with the welfare's
            membership guidelines. Please confirm the current requirements
            during registration.
          </p>

          <span className="text-xs font-medium text-muted-foreground">
            Itumbu Welfare
          </span>
        </div>

      </div>
    </section>
  );
};

export default Requirements;
