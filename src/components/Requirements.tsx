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
      className="relative overflow-hidden bg-slate-50 py-20 sm:py-24 lg:py-28"
    >
      {/* Background accents */}
      <div className="absolute left-0 top-0 h-2 w-full bg-blue-600" />
      <div className="absolute bottom-0 left-0 h-2 w-full bg-green-600" />

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">

        {/* =====================================================
            HEADER
        ====================================================== */}
        <div className="mb-14 flex flex-col gap-6 lg:mb-16 lg:flex-row lg:items-end lg:justify-between">

          <div className="max-w-3xl">

            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-white shadow-sm">
              <Users className="h-4 w-4" />

              <span className="text-xs font-bold uppercase tracking-wider">
                Membership
              </span>
            </div>

            <h2 className="text-4xl font-black leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Membership
              <span className="block text-blue-600">
                Requirements
              </span>
            </h2>
          </div>

          <div className="max-w-xl lg:pb-1">
            <p className="text-base leading-7 text-slate-600 sm:text-lg">
              Joining Itumbu Welfare is simple. Find out who can become a
              member and how contributions are structured.
            </p>
          </div>
        </div>


        {/* =====================================================
            TWO MAIN COLUMNS
        ====================================================== */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">

          {/* =================================================
              WHO CAN JOIN
          ================================================== */}
          <div className="overflow-hidden rounded-3xl border border-blue-200 bg-white shadow-lg shadow-blue-100/60">

            {/* Blue header */}
            <div className="bg-blue-600 px-6 py-7 text-white sm:px-8">

              <div className="flex items-center justify-between">

                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-100">
                    Eligibility
                  </p>

                  <h3 className="text-2xl font-black sm:text-3xl">
                    Who Can Join
                  </h3>
                </div>

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-md">
                  <Users className="h-7 w-7" />
                </div>

              </div>

              <p className="mt-4 max-w-lg text-sm leading-6 text-blue-100">
                Our welfare is built around an open and inclusive membership
                community.
              </p>
            </div>


            {/* Requirements */}
            <div className="divide-y divide-slate-100">

              {eligibilityRequirements.map((requirement, index) => {
                const Icon = requirement.icon;

                return (
                  <Card
                    key={index}
                    className="group rounded-none border-0 bg-white shadow-none transition-colors duration-200 hover:bg-blue-50/60"
                  >
                    <CardContent className="p-0">

                      <div className="flex items-center gap-4 px-5 py-5 sm:px-7 sm:py-6">

                        {/* Number */}
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-black text-blue-700">
                          {index + 1}
                        </div>

                        {/* Icon */}
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
                          <Icon className="h-5 w-5" />
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <h4 className="text-base font-bold text-slate-900 sm:text-lg">
                            {requirement.title}
                          </h4>

                          <p className="mt-1 text-sm leading-6 text-slate-500">
                            {requirement.description}
                          </p>
                        </div>

                        <CheckCircle className="hidden h-5 w-5 shrink-0 text-green-500 sm:block" />

                      </div>

                    </CardContent>
                  </Card>
                );
              })}

            </div>
          </div>


          {/* =================================================
              CONTRIBUTION RULES
          ================================================== */}
          <div className="overflow-hidden rounded-3xl border border-green-200 bg-white shadow-lg shadow-green-100/60">

            {/* Green header */}
            <div className="bg-green-600 px-6 py-7 text-white sm:px-8">

              <div className="flex items-center justify-between">

                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-green-100">
                    Financial Guidelines
                  </p>

                  <h3 className="text-2xl font-black sm:text-3xl">
                    Contribution Rules
                  </h3>
                </div>

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-green-600 shadow-md">
                  <DollarSign className="h-7 w-7" />
                </div>

              </div>

              <p className="mt-4 max-w-lg text-sm leading-6 text-green-100">
                Clear contribution guidelines help us support members when
                they need the community most.
              </p>
            </div>


            {/* Contributions */}
            <div className="divide-y divide-slate-100">

              {contributionRules.map((rule, index) => {
                const Icon = rule.icon;

                return (
                  <Card
                    key={index}
                    className="group rounded-none border-0 bg-white shadow-none transition-colors duration-200 hover:bg-green-50/60"
                  >
                    <CardContent className="p-0">

                      <div className="flex items-center gap-4 px-5 py-5 sm:px-7 sm:py-6">

                        {/* Number */}
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-black text-green-700">
                          {index + 1}
                        </div>

                        {/* Icon */}
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-600 text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
                          <Icon className="h-5 w-5" />
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <h4 className="text-base font-bold text-slate-900 sm:text-lg">
                            {rule.title}
                          </h4>

                          <p className="mt-1 text-sm leading-6 text-slate-500">
                            {rule.description}
                          </p>
                        </div>

                        <CheckCircle className="hidden h-5 w-5 shrink-0 text-blue-500 sm:block" />

                      </div>

                    </CardContent>
                  </Card>
                );
              })}

            </div>
          </div>

        </div>


        {/* =====================================================
            KEY FIGURES
        ====================================================== */}
        <div className="mt-10 overflow-hidden rounded-3xl bg-slate-900 shadow-xl">

          {/* Top title */}
          <div className="flex flex-col gap-2 border-b border-white/10 px-6 py-6 sm:px-8 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-400">
                At a glance
              </p>

              <h3 className="mt-1 text-xl font-bold text-white sm:text-2xl">
                Key Membership Figures
              </h3>
            </div>

            <p className="text-sm text-slate-400">
              Simple. Transparent. Community focused.
            </p>
          </div>


          {/* Figures */}
          <div className="grid grid-cols-1 sm:grid-cols-3">

            {/* AGE */}
            <div className="relative overflow-hidden border-b border-white/10 px-6 py-8 sm:border-b-0 sm:border-r sm:px-8 lg:px-10">

              <div className="absolute right-[-20px] top-[-30px] text-[130px] font-black leading-none text-blue-500/10">
                18
              </div>

              <div className="relative">

                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <Calendar className="h-6 w-6" />
                </div>

                <p className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  Minimum Age
                </p>

                <div className="mt-2 text-4xl font-black text-white sm:text-5xl">
                  18+
                </div>

                <p className="mt-2 text-sm text-slate-400">
                  Open to all adults
                </p>

              </div>
            </div>


            {/* CONTRIBUTION */}
            <div className="relative overflow-hidden border-b border-white/10 px-6 py-8 sm:border-b-0 sm:border-r sm:px-8 lg:px-10">

              <div className="absolute right-[-20px] top-[-30px] text-[130px] font-black leading-none text-green-500/10">
                100
              </div>

              <div className="relative">

                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-green-600 text-white">
                  <DollarSign className="h-6 w-6" />
                </div>

                <p className="text-xs font-bold uppercase tracking-wider text-green-400">
                  Standard Contribution
                </p>

                <div className="mt-2 text-4xl font-black text-white sm:text-5xl">
                  Ksh 100
                </div>

                <p className="mt-2 text-sm text-slate-400">
                  Per bereavement occurrence
                </p>

              </div>
            </div>


            {/* REGISTRATION */}
            <div className="relative overflow-hidden px-6 py-8 sm:px-8 lg:px-10">

              <div className="absolute right-[-20px] top-[-30px] text-[130px] font-black leading-none text-amber-500/10">
                1K
              </div>

              <div className="relative">

                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-white">
                  <CheckCircle className="h-6 w-6" />
                </div>

                <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Registration
                </p>

                <div className="mt-2 text-4xl font-black text-white sm:text-5xl">
                  Ksh 1000
                </div>

                <p className="mt-2 text-sm text-slate-400">
                  One-time registration fee
                </p>

              </div>
            </div>

          </div>
        </div>


        {/* =====================================================
            BOTTOM CALLOUT
        ====================================================== */}
        <div className="mt-8 flex flex-col overflow-hidden rounded-2xl bg-blue-600 sm:flex-row sm:items-center">

          <div className="flex h-16 w-16 shrink-0 items-center justify-center bg-green-500 text-white sm:h-20 sm:w-20">
            <CheckCircle className="h-7 w-7" />
          </div>

          <div className="px-5 py-5 sm:px-7">
            <h4 className="font-bold text-white">
              Everyone deserves a community that stands with them.
            </h4>

            <p className="mt-1 text-sm leading-6 text-blue-100">
              Review the requirements above and become part of Itumbu Welfare.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
};

export default Requirements;
