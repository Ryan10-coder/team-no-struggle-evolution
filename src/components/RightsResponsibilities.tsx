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
    <section
      id="rights"
      className="relative overflow-hidden bg-slate-50 py-20 sm:py-24 lg:py-28"
    >
      {/* Strong section color bars */}
      <div className="absolute left-0 top-0 h-2 w-full bg-blue-600" />
      <div className="absolute bottom-0 left-0 h-2 w-full bg-green-600" />

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="mx-auto mb-14 max-w-4xl text-center sm:mb-16">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-white shadow-md">
            <Shield className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-[0.16em]">
              Member Guidelines
            </span>
          </div>

          <h2 className="mb-6 text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Rights &{' '}
            <span className="text-blue-600">
              Responsibilities
            </span>
          </h2>

          <p className="mx-auto max-w-3xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8 lg:text-xl">
            Understanding your rights as a member and the conditions that govern
            our community participation and welfare group membership.
          </p>
        </div>

        {/* Rights & Dismissal */}
        <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">

          {/* Member Rights */}
          <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-xl">
            <div className="bg-blue-600 px-6 py-7 text-white sm:px-8">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                  <Shield className="h-7 w-7" />
                </div>

                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-blue-100">
                    Member Rights
                  </p>
                  <h3 className="text-2xl font-black sm:text-3xl">
                    Your Rights as a Member
                  </h3>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-5 sm:p-7">
              {memberRights.map((right, index) => {
                const Icon = right.icon;

                return (
                  <Card
                    key={index}
                    className="group overflow-hidden border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-lg"
                  >
                    <CardContent className="p-5 sm:p-6">
                      <div className="flex items-start gap-4 sm:gap-5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition-transform duration-300 group-hover:scale-105 sm:h-14 sm:w-14">
                          <Icon className="h-6 w-6" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex items-start gap-3">
                            <span className="mt-1 text-xs font-black text-blue-600">
                              0{index + 1}
                            </span>

                            <h4 className="text-lg font-extrabold leading-tight text-slate-900 transition-colors duration-300 group-hover:text-blue-700 sm:text-xl">
                              {right.title}
                            </h4>
                          </div>

                          <p className="pl-7 text-sm leading-6 text-slate-600 sm:text-base">
                            {right.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Dismissal Conditions */}
          <div className="overflow-hidden rounded-3xl border border-red-100 bg-white shadow-xl">
            <div className="bg-red-600 px-6 py-7 text-white sm:px-8">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                  <AlertTriangle className="h-7 w-7" />
                </div>

                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-red-100">
                    Membership Rules
                  </p>
                  <h3 className="text-2xl font-black sm:text-3xl">
                    Dismissal Conditions
                  </h3>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-5 sm:p-7">
              {dismissalConditions.map((condition, index) => {
                const Icon = condition.icon;

                return (
                  <Card
                    key={index}
                    className="group overflow-hidden border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-red-300 hover:bg-red-50/50 hover:shadow-lg"
                  >
                    <CardContent className="p-5 sm:p-6">
                      <div className="flex items-start gap-4 sm:gap-5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm transition-transform duration-300 group-hover:scale-105 sm:h-14 sm:w-14">
                          <Icon className="h-6 w-6" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex items-start gap-3">
                            <span className="mt-1 text-xs font-black text-red-600">
                              0{index + 1}
                            </span>

                            <h4 className="text-lg font-extrabold leading-tight text-slate-900 transition-colors duration-300 group-hover:text-red-700 sm:text-xl">
                              {condition.title}
                            </h4>
                          </div>

                          <p className="pl-7 text-sm leading-6 text-slate-600 sm:text-base">
                            {condition.description}
                          </p>
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
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 shadow-2xl">
          <div className="h-2 w-full bg-green-600" />

          <div className="p-6 sm:p-8 lg:p-10">
            <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-3xl">
                <div className="mb-4 inline-flex rounded-full bg-green-600 px-4 py-2 text-white">
                  <span className="text-xs font-bold uppercase tracking-[0.16em]">
                    Our Commitment
                  </span>
                </div>

                <h3 className="mb-4 text-3xl font-black text-white sm:text-4xl">
                  Community{' '}
                  <span className="text-green-400">
                    Responsibilities
                  </span>
                </h3>

                <p className="text-base leading-7 text-slate-300 sm:text-lg">
                  Together we build a stronger, more supportive community through shared values and responsibilities
                </p>
              </div>

              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-green-600 text-white shadow-lg">
                <Handshake className="h-8 w-8" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {communityResponsibilities.map((responsibility, index) => {
                const Icon = responsibility.icon;

                return (
                  <div
                    key={index}
                    className="group rounded-2xl border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-green-400/40 hover:bg-white/10 hover:shadow-lg sm:p-6"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-600 text-white transition-transform duration-300 group-hover:scale-105">
                        <Icon className="h-6 w-6" />
                      </div>

                      <span className="text-sm font-bold leading-6 text-white sm:text-base">
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
