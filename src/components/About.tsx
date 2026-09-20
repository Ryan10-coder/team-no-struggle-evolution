import { Card, CardContent } from '@/components/ui/card';
import { Users, Heart, Shield, Target, Award, Globe } from 'lucide-react';

const About = () => {
  const features = [
    {
      icon: Heart,
      title: 'Contribution Model',
      description: 'Each member contributes Ksh 100 per occurrence (Ksh 50 for children under 10) to support families in need.',
      gradient: 'from-rose-500/20 to-orange-500/20'
    },
    {
      icon: Shield,
      title: 'Guaranteed Payouts after achieving the registration membership target',
      description: 'Up to Ksh 300,000 for principal members, spouses and parents; Ksh 150,000 for children under 10.',
      gradient: 'from-blue-500/20 to-cyan-500/20'
    },
    {
      icon: Users,
      title: 'Open Membership',
      description: 'Anyone 18+, any gender, no residence boundaries. Join our inclusive community of 3,500+ members.',
      gradient: 'from-violet-500/20 to-purple-500/20'
    },
    {
      icon: Target,
      title: 'Pooled Support',
      description: 'Small contributions from many members create a powerful safety net for all families.',
      gradient: 'from-emerald-500/20 to-teal-500/20'
    },
    {
      icon: Award,
      title: 'Administrative Fee',
      description: 'One-time Ksh 1000 registration fee to join and become part of our supportive community.',
      gradient: 'from-amber-500/20 to-yellow-500/20'
    },
    {
      icon: Globe,
      title: 'Wide Coverage',
      description: 'Supporting members and their families across all regions with no geographical restrictions.',
      gradient: 'from-sky-500/20 to-indigo-500/20'
    },
  ];

  return (
    <section
      id="about"
      className="relative overflow-hidden bg-slate-50 py-24 md:py-32 dark:bg-slate-950"
    >
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      {/* Subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">

        {/* Introduction */}
        <div className="mx-auto mb-20 max-w-4xl text-center">

          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-5 py-2.5 shadow-sm dark:border-blue-900/50 dark:bg-slate-900">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 shadow-[0_0_0_4px_rgba(37,99,235,0.12)]" />
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
              About Our Community
            </span>
          </div>

          <h2 className="mb-7 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-5xl lg:text-6xl">
            About{' '}
            <span className="bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Itumbu Welfare
            </span>
          </h2>

          <p className="mx-auto max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300 md:text-lg">
            Itumbu Welfare is a benevolent welfare group targeting 3,500+ members. We operate through
            a pooled support system where members contribute small amounts to collectively support families
            during difficult times, particularly with funeral expenses and related needs.
          </p>

          {/* Small visual divider */}
          <div className="mx-auto mt-8 flex items-center justify-center gap-2">
            <span className="h-1 w-10 rounded-full bg-blue-600" />
            <span className="h-1 w-20 rounded-full bg-indigo-500" />
            <span className="h-1 w-10 rounded-full bg-violet-500" />
          </div>
        </div>

        {/* Features */}
        <div className="mb-24 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <Card
                key={index}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-transparent hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900"
              >
                {/* Colored top accent */}
                <div
                  className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${feature.gradient.replace(
                    '/20',
                    ''
                  )}`}
                />

                {/* Hover background */}
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
                />

                <CardContent className="relative z-10 p-7 md:p-8">

                  {/* Icon */}
                  <div className="mb-7 flex items-center justify-between">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} border border-white/70 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg dark:border-slate-700`}
                    >
                      <Icon
                        className="h-7 w-7 text-slate-700 transition-colors duration-300 group-hover:text-primary dark:text-slate-200"
                        strokeWidth={1.8}
                      />
                    </div>

                    <span className="text-xs font-bold text-slate-300 dark:text-slate-700">
                      0{index + 1}
                    </span>
                  </div>

                  <h3 className="mb-3 text-xl font-bold tracking-tight text-slate-900 transition-colors duration-300 group-hover:text-primary dark:text-white">
                    {feature.title}
                  </h3>

                  <p className="text-sm leading-7 text-slate-600 dark:text-slate-400">
                    {feature.description}
                  </p>

                  <div className="mt-7 flex items-center gap-2">
                    <span className="h-1 w-8 rounded-full bg-primary transition-all duration-300 group-hover:w-14" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                      Community Support
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Community Gallery */}
        <div className="mb-24">

          <div className="mb-12 text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-5 py-2.5 dark:border-violet-900/50 dark:bg-violet-950/30">
              <span className="flex h-2 w-2 rounded-full bg-violet-600" />
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-400">
                Community Gallery
              </span>
            </div>

            <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-5xl">
              Our Team in{' '}
              <span className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
                Action
              </span>
            </h3>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-400 md:text-base">
              A community built around togetherness, responsibility and support.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">

            {/* Gallery Item 1 */}
            <div className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-3xl bg-slate-200 shadow-lg ring-1 ring-slate-200 transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-2xl dark:bg-slate-800 dark:ring-slate-700">

                <img
                  src="/lovable-uploads/2b896dec-cf05-49e1-adf4-2812daf80b94.png"
                  alt="Itumbu Welfare members gathering together for community support"
                  className="h-80 w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-blue-950/90 via-blue-950/10 to-transparent opacity-90" />

                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="mb-3 h-1 w-10 rounded-full bg-blue-400 transition-all duration-300 group-hover:w-16" />
                  <p className="text-lg font-bold text-white">
                    Our dedicated team members
                  </p>
                  <p className="mt-1 text-sm text-blue-100">
                    Working together for the community
                  </p>
                </div>
              </div>
            </div>

            {/* Gallery Item 2 */}
            <div className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-3xl bg-slate-200 shadow-lg ring-1 ring-slate-200 transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-2xl dark:bg-slate-800 dark:ring-slate-700">

                <img
                  src="/lovable-uploads/72c12052-4bfc-47e0-83da-a8ab3a74fc60.png"
                  alt="Itumbu Welfare community volunteers in their signature uniforms"
                  className="h-80 w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-violet-950/90 via-violet-950/10 to-transparent opacity-90" />

                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="mb-3 h-1 w-10 rounded-full bg-violet-400 transition-all duration-300 group-hover:w-16" />
                  <p className="text-lg font-bold text-white">
                    Community volunteers united
                  </p>
                  <p className="mt-1 text-sm text-violet-100">
                    Strength through collective action
                  </p>
                </div>
              </div>
            </div>

            {/* Gallery Item 3 */}
            <div className="group cursor-pointer md:col-span-2 lg:col-span-1">
              <div className="relative overflow-hidden rounded-3xl bg-slate-200 shadow-lg ring-1 ring-slate-200 transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-2xl dark:bg-slate-800 dark:ring-slate-700">

                <img
                  src="/lovable-uploads/5799a3f3-3192-499e-9b94-50df16c3444a.png"
                  alt="Itumbu Welfare members providing support and care to community members in need"
                  className="h-80 w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-950/10 to-transparent opacity-90" />

                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="mb-3 h-1 w-10 rounded-full bg-emerald-400 transition-all duration-300 group-hover:w-16" />
                  <p className="text-lg font-bold text-white">
                    Supporting those in need
                  </p>
                  <p className="mt-1 text-sm text-emerald-100">
                    Standing together when it matters
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* How It Works */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">

          {/* Decorative color bar */}
          <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-blue-600 via-violet-600 to-emerald-500" />

          {/* Decorative background */}
          <div className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-blue-500/5 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-violet-500/5 blur-3xl" />

          <div className="grid grid-cols-1 lg:grid-cols-2">

            {/* Content */}
            <div className="relative z-10 p-8 md:p-12 lg:p-14">

              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-5 py-2.5 dark:border-blue-900/50 dark:bg-blue-950/30">
                <span className="h-2 w-2 rounded-full bg-blue-600" />
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
                  How It Works
                </span>
              </div>

              <h3 className="mb-6 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-4xl">
                How Our Pooled Support{' '}
                <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                  Works
                </span>
              </h3>

              <p className="mb-9 text-base leading-8 text-slate-600 dark:text-slate-300">
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
                    className="group/item flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-4 transition-all duration-300 hover:border-blue-200 hover:bg-blue-50/60 hover:shadow-sm dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-blue-900 dark:hover:bg-blue-950/20"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 transition-colors duration-300 group-hover/item:bg-blue-600 dark:bg-blue-950">
                      <div className="h-2.5 w-2.5 rounded-full bg-blue-600 transition-colors duration-300 group-hover/item:bg-white" />
                    </div>

                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Statistics */}
            <div className="relative z-10 border-t border-slate-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 p-8 dark:border-slate-800 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-violet-950/30 md:p-12 lg:border-l lg:border-t-0 lg:p-14">

              <div className="mb-8">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  At a Glance
                </p>
                <h4 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                  Our Community Numbers
                </h4>
              </div>

              <div className="grid h-full grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-1">

                {/* Members */}
                <div className="group rounded-2xl border border-blue-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg dark:border-blue-900/40 dark:bg-slate-900">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>

                    <span className="text-xs font-bold text-blue-600">
                      MEMBERS
                    </span>
                  </div>

                  <div className="mb-1 text-4xl font-extrabold tracking-tight text-blue-700 dark:text-blue-400 md:text-5xl">
                    3,500+
                  </div>

                  <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Target Members
                  </div>
                </div>

                {/* Payout */}
                <div className="group rounded-2xl border border-violet-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-violet-300 hover:shadow-lg dark:border-violet-900/40 dark:bg-slate-900">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-950">
                      <Shield className="h-5 w-5 text-violet-600" />
                    </div>

                    <span className="text-xs font-bold text-violet-600">
                      SUPPORT
                    </span>
                  </div>

                  <div className="mb-1 text-4xl font-extrabold tracking-tight text-violet-700 dark:text-violet-400 md:text-5xl">
                    Ksh 300K
                  </div>

                  <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Max Payout
                  </div>
                </div>

                {/* Registration */}
                <div className="group rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg dark:border-emerald-900/40 dark:bg-slate-900">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950">
                      <Award className="h-5 w-5 text-emerald-600" />
                    </div>

                    <span className="text-xs font-bold text-emerald-600">
                      REGISTRATION
                    </span>
                  </div>

                  <div className="mb-1 text-4xl font-extrabold tracking-tight text-emerald-700 dark:text-emerald-400 md:text-5xl">
                    Ksh 1000
                  </div>

                  <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
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

