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
    <section
      id="about"
      className="relative overflow-hidden bg-background py-20 md:py-28"
    >
      {/* Subtle background texture */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.025]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
            backgroundSize: '42px 42px',
          }}
        />
      </div>

      {/* Soft ambient shapes */}
      <div className="pointer-events-none absolute -left-40 top-20 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 bottom-20 h-80 w-80 rounded-full bg-secondary/5 blur-3xl" />

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">

        {/* Introduction */}
        <div className="mx-auto mb-16 max-w-3xl text-center md:mb-20">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-4 py-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              About Our Community
            </span>
          </div>

          <h2 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            About{' '}
            <span className="text-primary">
              Itumbu Welfare
            </span>
          </h2>

          <p className="text-base leading-8 text-muted-foreground md:text-lg">
            Itumbu Welfare is a benevolent welfare group targeting 3,500+ members. We operate through
            a pooled support system where members contribute small amounts to collectively support families
            during difficult times, particularly with funeral expenses and related needs.
          </p>
        </div>

        {/* Features */}
        <div className="mb-20 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <Card
                key={index}
                className="group relative overflow-hidden rounded-2xl border-border/70 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
              >
                {/* Small accent line */}
                <div className="absolute left-0 top-0 h-1 w-0 bg-primary transition-all duration-300 group-hover:w-full" />

                <CardContent className="relative p-7 md:p-8">

                  {/* Icon */}
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-primary/15 bg-primary/5 transition-all duration-300 group-hover:border-primary/25 group-hover:bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" strokeWidth={1.8} />
                  </div>

                  <h3 className="mb-3 text-lg font-semibold tracking-tight text-foreground transition-colors duration-300 group-hover:text-primary">
                    {feature.title}
                  </h3>

                  <p className="text-sm leading-7 text-muted-foreground">
                    {feature.description}
                  </p>

                  {/* Bottom detail */}
                  <div className="mt-6 flex items-center gap-2">
                    <span className="h-px w-7 bg-primary/40 transition-all duration-300 group-hover:w-12" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                      Itumbu Welfare
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Community Gallery */}
        <div className="mb-20">
          <div className="mb-10 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-4 py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Community Gallery
              </span>
            </div>

            <h3 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Our Team in{' '}
              <span className="text-primary">
                Action
              </span>
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">

            {/* Gallery Item 1 */}
            <div className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-2xl bg-muted shadow-sm ring-1 ring-border/60 transition-all duration-300 group-hover:shadow-xl group-hover:ring-primary/30">
                <img
                  src="/lovable-uploads/2b896dec-cf05-49e1-adf4-2812daf80b94.png"
                  alt="Itumbu Welfare members gathering together for community support"
                  className="h-80 w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />

                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="text-base font-semibold text-white">
                    Our dedicated team members
                  </p>
                  <div className="mt-2 h-px w-8 bg-white/70 transition-all duration-300 group-hover:w-14" />
                </div>
              </div>
            </div>

            {/* Gallery Item 2 */}
            <div className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-2xl bg-muted shadow-sm ring-1 ring-border/60 transition-all duration-300 group-hover:shadow-xl group-hover:ring-primary/30">
                <img
                  src="/lovable-uploads/72c12052-4bfc-47e0-83da-a8ab3a74fc60.png"
                  alt="Itumbu Welfare community volunteers in their signature uniforms"
                  className="h-80 w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />

                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="text-base font-semibold text-white">
                    Community volunteers united
                  </p>
                  <div className="mt-2 h-px w-8 bg-white/70 transition-all duration-300 group-hover:w-14" />
                </div>
              </div>
            </div>

            {/* Gallery Item 3 */}
            <div className="group cursor-pointer md:col-span-2 lg:col-span-1">
              <div className="relative overflow-hidden rounded-2xl bg-muted shadow-sm ring-1 ring-border/60 transition-all duration-300 group-hover:shadow-xl group-hover:ring-primary/30">
                <img
                  src="/lovable-uploads/5799a3f3-3192-499e-9b94-50df16c3444a.png"
                  alt="Itumbu Welfare members providing support and care to community members in need"
                  className="h-80 w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />

                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="text-base font-semibold text-white">
                    Supporting those in need
                  </p>
                  <div className="mt-2 h-px w-8 bg-white/70 transition-all duration-300 group-hover:w-14" />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* How It Works */}
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-sm">

          {/* Subtle accent */}
          <div className="absolute left-0 top-0 h-full w-1 bg-primary" />

          <div className="grid grid-cols-1 lg:grid-cols-2">

            {/* Content */}
            <div className="p-8 md:p-12 lg:p-14">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  How It Works
                </span>
              </div>

              <h3 className="mb-5 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                How Our Pooled Support{' '}
                <span className="text-primary">
                  Works
                </span>
              </h3>

              <p className="mb-8 text-base leading-8 text-muted-foreground">
                Our benevolent welfare system operates on the principle of collective responsibility.
                When a member or their family faces a bereavement, our community comes together to
                provide immediate financial support through our pooled contribution system.
              </p>

              <div className="space-y-3">
                {[
                  'Ksh 100 contribution per occurrence',
                  'Ksh 50 for children under 10',
                  'Ksh 1000 one-time registration fee',
                  'Transparent community-driven process'
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 rounded-xl border border-border/70 bg-muted/20 px-4 py-4 transition-colors duration-200 hover:border-primary/30 hover:bg-primary/5"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>

                    <span className="text-sm font-medium text-foreground">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Statistics */}
            <div className="border-t border-border bg-muted/30 p-8 md:p-12 lg:border-l lg:border-t-0 lg:p-14">
              <div className="grid h-full grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-1">

                <div className="rounded-2xl border border-border bg-background p-6 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md">
                  <div className="mb-2 text-4xl font-bold tracking-tight text-primary md:text-5xl">
                    3,500+
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Target Members
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-background p-6 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md">
                  <div className="mb-2 text-4xl font-bold tracking-tight text-primary md:text-5xl">
                    Ksh 300K
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Max Payout
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-background p-6 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md">
                  <div className="mb-2 text-4xl font-bold tracking-tight text-primary md:text-5xl">
                    Ksh 1000
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">
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

export default About;
