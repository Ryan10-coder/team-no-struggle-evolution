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
      className="relative overflow-hidden bg-[#f6f8fb] py-24 md:py-32 dark:bg-[#07111f]"
    >

      {/* Background atmosphere */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-52 -top-52 h-[520px] w-[520px] rounded-full bg-blue-600/[0.07] blur-3xl" />
        <div className="absolute -right-52 top-[20%] h-[500px] w-[500px] rounded-full bg-indigo-600/[0.06] blur-3xl" />
        <div className="absolute bottom-0 left-[35%] h-[450px] w-[450px] rounded-full bg-emerald-500/[0.05] blur-3xl" />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">

        {/* =========================================================
            INTRO / ABOUT SECTION
        ========================================================= */}
        <div className="mb-24 grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]">

          {/* Left visual marker */}
          <div className="relative hidden min-h-[320px] lg:block">
            <div className="absolute left-8 top-8 h-64 w-64 rounded-[40px] bg-gradient-to-br from-blue-600 to-indigo-700 shadow-2xl shadow-blue-600/20" />

            <div className="absolute left-0 top-0 h-64 w-64 rounded-[40px] border border-white/70 bg-white/90 p-8 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
              <div className="flex h-full flex-col justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                  <Heart className="h-7 w-7" strokeWidth={1.8} />
                </div>

                <div>
                  <div className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                    3,500+
                  </div>
                  <div className="mt-1 text-sm font-medium text-slate-500">
                    Community Target
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 right-2 flex h-24 w-44 items-center gap-4 rounded-2xl border border-white/80 bg-white px-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950">
                <Users className="h-5 w-5 text-emerald-600" />
              </div>

              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  One Community
                </div>
                <div className="text-xs text-slate-500">
                  Collective Support
                </div>
              </div>
            </div>
          </div>

          {/* Introduction */}
          <div className="max-w-3xl">

            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-10 bg-blue-600" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-400">
                About Our Community
              </span>
            </div>

            <h2 className="mb-7 text-4xl font-black leading-[1.05] tracking-[-0.03em] text-slate-950 dark:text-white md:text-5xl lg:text-6xl">
              About{' '}
              <span className="text-blue-700 dark:text-blue-400">
                Itumbu Welfare
              </span>
            </h2>

            <p className="max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300 md:text-lg">
              Itumbu Welfare is a benevolent welfare group targeting 3,500+ members. We operate through
              a pooled support system where members contribute small amounts to collectively support families
              during difficult times, particularly with funeral expenses and related needs.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <div className="rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
                Collective Responsibility
              </div>

              <div className="rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                Community Support
              </div>

              <div className="rounded-full border border-violet-100 bg-violet-50 px-4 py-2 text-xs font-semibold text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300">
                Shared Protection
              </div>
            </div>
          </div>
        </div>


        {/* =========================================================
            FEATURES SECTION
        ========================================================= */}
        <div className="mb-28">

          <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <span className="h-px w-8 bg-blue-600" />
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
                  Why Itumbu
                </span>
              </div>

              <h3 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white md:text-4xl">
                Built Around{' '}
                <span className="text-blue-700 dark:text-blue-400">
                  Community
                </span>
              </h3>
            </div>

            <p className="max-w-md text-sm leading-7 text-slate-500 dark:text-slate-400 md:text-right">
              A simple pooled support model designed to bring members together
              when families need help the most.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <Card
                  key={index}
                  className="group relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_8px_30px_rgb(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-2 hover:border-blue-200 hover:shadow-[0_20px_50px_rgb(15,23,42,0.10)] dark:border-slate-800 dark:bg-slate-900"
                >

                  {/* Number */}
                  <div className="absolute right-6 top-5 text-xs font-black tracking-widest text-slate-200 dark:text-slate-700">
                    0{index + 1}
                  </div>

                  {/* Colored side accent */}
                  <div className="absolute bottom-0 left-0 top-0 w-1 bg-gradient-to-b from-blue-600 via-indigo-500 to-violet-500 opacity-70 transition-all duration-300 group-hover:w-1.5 group-hover:opacity-100" />

                  <CardContent className="relative p-7 md:p-8">

                    <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 transition-all duration-300 group-hover:bg-blue-600 group-hover:shadow-lg group-hover:shadow-blue-600/20 dark:bg-slate-800">
                      <Icon
                        className="h-6 w-6 text-blue-600 transition-all duration-300 group-hover:text-white group-hover:scale-110"
                        strokeWidth={1.8}
                      />
                    </div>

                    <h3 className="mb-3 pr-8 text-lg font-bold leading-snug tracking-tight text-slate-900 transition-colors duration-300 group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-400">
                      {feature.title}
                    </h3>

                    <p className="text-sm leading-7 text-slate-600 dark:text-slate-400">
                      {feature.description}
                    </p>

                    <div className="mt-7 flex items-center gap-2">
                      <span className="h-1 w-6 rounded-full bg-blue-600 transition-all duration-300 group-hover:w-12" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                        Itumbu Welfare
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>


        {/* =========================================================
            GALLERY SECTION
        ========================================================= */}
        <div className="mb-28">

          <div className="mb-12">
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px w-8 bg-violet-600" />
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-400">
                Community Gallery
              </span>
            </div>

            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <h3 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white md:text-5xl">
                Our Team in{' '}
                <span className="text-violet-700 dark:text-violet-400">
                  Action
                </span>
              </h3>

              <p className="max-w-md text-sm leading-7 text-slate-500 dark:text-slate-400 md:text-right">
                Real people. Shared responsibility. A community that stands together.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-12">

            {/* Image 1 */}
            <div className="group cursor-pointer md:col-span-7">
              <div className="relative h-[420px] overflow-hidden rounded-[28px] bg-slate-200 shadow-lg dark:bg-slate-800">

                <img
                  src="/lovable-uploads/2b896dec-cf05-49e1-adf4-2812daf80b94.png"
                  alt="Itumbu Welfare members gathering together for community support"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent" />

                <div className="absolute bottom-0 left-0 p-7 md:p-8">
                  <div className="mb-3 h-1 w-10 rounded-full bg-blue-400" />
                  <p className="text-xl font-bold text-white">
                    Our dedicated team members
                  </p>
                </div>
              </div>
            </div>

            {/* Image 2 */}
            <div className="group cursor-pointer md:col-span-5">
              <div className="relative h-[420px] overflow-hidden rounded-[28px] bg-slate-200 shadow-lg dark:bg-slate-800">

                <img
                  src="/lovable-uploads/72c12052-4bfc-47e0-83da-a8ab3a74fc60.png"
                  alt="Itumbu Welfare community volunteers in their signature uniforms"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent" />

                <div className="absolute bottom-0 left-0 p-7">
                  <div className="mb-3 h-1 w-10 rounded-full bg-violet-400" />
                  <p className="text-xl font-bold text-white">
                    Community volunteers united
                  </p>
                </div>
              </div>
            </div>

            {/* Image 3 */}
            <div className="group cursor-pointer md:col-span-12">
              <div className="relative h-[360px] overflow-hidden rounded-[28px] bg-slate-200 shadow-lg dark:bg-slate-800">

                <img
                  src="/lovable-uploads/5799a3f3-3192-499e-9b94-50df16c3444a.png"
                  alt="Itumbu Welfare members providing support and care to community members in need"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/80 via-transparent to-transparent" />

                <div className="absolute bottom-0 left-0 p-7 md:p-9">
                  <div className="mb-3 h-1 w-10 rounded-full bg-emerald-400" />
                  <p className="text-xl font-bold text-white md:text-2xl">
                    Supporting those in need
                  </p>
                  <p className="mt-2 max-w-md text-sm text-emerald-50/90">
                    Standing together and providing support when it matters most.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>


        {/* =========================================================
            HOW IT WORKS SECTION
        ========================================================= */}
        <div className="relative overflow-hidden rounded-[32px] bg-slate-950 shadow-2xl">

          {/* Background color blocks */}
          <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-br from-blue-700/30 via-indigo-700/20 to-violet-700/30" />

          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr]">

            {/* Left */}
            <div className="p-8 md:p-12 lg:p-16">

              <div className="mb-6 flex items-center gap-3">
                <span className="h-px w-8 bg-blue-400" />

                <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">
                  How It Works
                </span>
              </div>

              <h3 className="mb-6 max-w-xl text-3xl font-black tracking-tight text-white md:text-5xl">
                How Our Pooled Support{' '}
                <span className="text-blue-400">
                  Works
                </span>
              </h3>

              <p className="mb-9 max-w-xl text-base leading-8 text-slate-300">
                Our benevolent welfare system operates on the principle of collective responsibility.
                When a member or their family faces a bereavement, our community comes together to
                provide immediate financial support through our pooled contribution system.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  'Ksh 100 contribution per occurrence',
                  'Ksh 50 for children under 10',
                  'Ksh 1000 one-time registration fee',
                  'Transparent community-driven process'
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-sm transition-all duration-300 hover:border-blue-400/40 hover:bg-white/[0.08]"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/15">
                      <span className="h-2 w-2 rounded-full bg-blue-400" />
                    </div>

                    <span className="text-sm font-medium text-slate-200">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>


            {/* Right statistics */}
            <div className="relative border-t border-white/10 p-8 md:p-12 lg:border-l lg:border-t-0 lg:p-12">

              <div className="mb-8">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                  Community at a glance
                </div>

                <div className="mt-2 text-lg font-semibold text-white">
                  Simple contributions. Meaningful support.
                </div>
              </div>

              <div className="space-y-4">

                {/* Members */}
                <div className="group flex items-center justify-between rounded-2xl border border-blue-400/20 bg-blue-500/10 p-5 transition-all duration-300 hover:border-blue-400/50 hover:bg-blue-500/15">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/15">
                      <Users className="h-6 w-6 text-blue-400" />
                    </div>

                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-blue-300">
                        Membership
                      </div>
                      <div className="mt-1 text-sm text-slate-400">
                        Target Members
                      </div>
                    </div>
                  </div>

                  <div className="text-3xl font-black text-white">
                    3,500+
                  </div>
                </div>


                {/* Payout */}
                <div className="group flex items-center justify-between rounded-2xl border border-violet-400/20 bg-violet-500/10 p-5 transition-all duration-300 hover:border-violet-400/50 hover:bg-violet-500/15">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/15">
                      <Shield className="h-6 w-6 text-violet-400" />
                    </div>

                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-violet-300">
                        Support
                      </div>
                      <div className="mt-1 text-sm text-slate-400">
                        Max Payout
                      </div>
                    </div>
                  </div>

                  <div className="text-3xl font-black text-white">
                    Ksh 300K
                  </div>
                </div>


                {/* Registration */}
                <div className="group flex items-center justify-between rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5 transition-all duration-300 hover:border-emerald-400/50 hover:bg-emerald-500/15">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15">
                      <Award className="h-6 w-6 text-emerald-400" />
                    </div>

                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                        Registration
                      </div>
                      <div className="mt-1 text-sm text-slate-400">
                        Registration Fee
                      </div>
                    </div>
                  </div>

                  <div className="text-3xl font-black text-white">
                    Ksh 1000
                  </div>
                </div>

              </div>

              <div className="mt-8 border-t border-white/10 pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    <div className="h-8 w-8 rounded-full border-2 border-slate-950 bg-blue-500" />
                    <div className="h-8 w-8 rounded-full border-2 border-slate-950 bg-violet-500" />
                    <div className="h-8 w-8 rounded-full border-2 border-slate-950 bg-emerald-500" />
                  </div>

                  <p className="text-xs leading-5 text-slate-400">
                    Collective support built around members helping members.
                  </p>
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

