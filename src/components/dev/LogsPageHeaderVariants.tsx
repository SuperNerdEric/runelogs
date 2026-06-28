import React from 'react';
import {FolderOpen} from 'lucide-react';
import {colors, contentColumnClass, accountTextClass} from '../../theme';
import {displayUsername} from '../../utils/utils';
import {cn} from '@/lib/utils';

const SAMPLE_UPLOADER = 'honorable';
const displayName = displayUsername(SAMPLE_UPLOADER);

const LogsIcon: React.FC = () => (
    <div className="flex size-14 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-surface-alt)]">
        <FolderOpen className="size-8" style={{color: colors.upload.dragActive}} aria-hidden/>
    </div>
);

interface HeaderShellProps {
    children: React.ReactNode;
    textClassName?: string;
}

const HeaderShell: React.FC<HeaderShellProps> = ({children, textClassName}) => (
    <div className="flex items-center gap-3">
        <LogsIcon/>
        <div className={cn('min-w-0', textClassName)}>{children}</div>
    </div>
);

interface VariantFrameProps {
    number: number;
    name: string;
    children: React.ReactNode;
}

const VariantFrame: React.FC<VariantFrameProps> = ({number, name, children}) => (
    <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-5">
        <p className="mb-4 text-[0.7rem] font-bold uppercase tracking-wider text-muted">
            {number}. {name}
        </p>
        {children}
    </div>
);

const Variant01Current: React.FC = () => (
    <HeaderShell>
        <h2 className="m-0 text-[2.125rem] font-semibold text-[var(--color-text-primary)]">Logs</h2>
        <p className={cn(accountTextClass, 'mt-1 text-base font-medium capitalize')}>{displayName}</p>
    </HeaderShell>
);

const Variant02InlineMiddot: React.FC = () => (
    <HeaderShell>
        <h2 className="m-0 text-[2.125rem] font-semibold text-[var(--color-text-primary)]">
            Logs
            <span className="mx-2 font-normal text-muted">·</span>
            <span className={cn(accountTextClass, 'font-semibold capitalize')}>{displayName}</span>
        </h2>
    </HeaderShell>
);

const Variant03InlineColon: React.FC = () => (
    <HeaderShell>
        <h2 className="m-0 text-[2.125rem] font-semibold text-[var(--color-text-primary)]">
            Logs:
            <span className={cn(accountTextClass, 'ml-2 font-semibold capitalize')}>{displayName}</span>
        </h2>
    </HeaderShell>
);

const Variant04InlineNameSmaller: React.FC = () => (
    <HeaderShell>
        <div className="flex flex-wrap items-baseline gap-2">
            <h2 className="m-0 text-[2.125rem] font-semibold text-[var(--color-text-primary)]">Logs</h2>
            <span className={cn(accountTextClass, 'text-lg font-semibold capitalize')}>{displayName}</span>
        </div>
    </HeaderShell>
);

const Variant05InlineNameSameSize: React.FC = () => (
    <HeaderShell>
        <div className="flex flex-wrap items-baseline gap-2">
            <h2 className="m-0 text-[2.125rem] font-semibold text-[var(--color-text-primary)]">Logs</h2>
            <h2 className={cn('m-0 text-[2.125rem] font-semibold capitalize', accountTextClass)}>{displayName}</h2>
        </div>
    </HeaderShell>
);

const Variant06EyebrowLogsNameHero: React.FC = () => (
    <HeaderShell>
        <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-wider text-muted">Logs</p>
        <h2 className="m-0 text-[2.125rem] font-semibold capitalize text-[var(--color-text-primary)]">{displayName}</h2>
    </HeaderShell>
);

const Variant07NameHeroLogsCaption: React.FC = () => (
    <HeaderShell>
        <h2 className={cn('m-0 text-[2.125rem] font-semibold capitalize', accountTextClass)}>{displayName}</h2>
        <p className="mt-1 text-sm text-muted">Uploaded logs</p>
    </HeaderShell>
);

const Variant08NameHeroWhiteLogsCaption: React.FC = () => (
    <HeaderShell>
        <h2 className="m-0 text-[2.125rem] font-semibold capitalize text-[var(--color-text-primary)]">{displayName}</h2>
        <p className="mt-1 text-sm text-muted">Logs</p>
    </HeaderShell>
);

const Variant09NameBelowLarger: React.FC = () => (
    <HeaderShell>
        <h2 className="m-0 text-[2.125rem] font-semibold text-[var(--color-text-primary)]">Logs</h2>
        <p className={cn(accountTextClass, 'mt-1 text-xl font-semibold capitalize')}>{displayName}</p>
    </HeaderShell>
);

const Variant10NameBelowSmaller: React.FC = () => (
    <HeaderShell>
        <h2 className="m-0 text-[2.125rem] font-semibold text-[var(--color-text-primary)]">Logs</h2>
        <p className={cn(accountTextClass, 'mt-1 text-[0.8125rem] font-medium capitalize')}>{displayName}</p>
    </HeaderShell>
);

const Variant11NameBelowBold: React.FC = () => (
    <HeaderShell>
        <h2 className="m-0 text-[2.125rem] font-semibold text-[var(--color-text-primary)]">Logs</h2>
        <p className={cn(accountTextClass, 'mt-1 text-base font-bold capitalize')}>{displayName}</p>
    </HeaderShell>
);

const Variant12NameBelowMuted: React.FC = () => (
    <HeaderShell>
        <h2 className="m-0 text-[2.125rem] font-semibold text-[var(--color-text-primary)]">Logs</h2>
        <p className="mt-1 text-base font-medium capitalize text-muted">{displayName}</p>
    </HeaderShell>
);

const Variant13AtUsername: React.FC = () => (
    <HeaderShell>
        <h2 className="m-0 text-[2.125rem] font-semibold text-[var(--color-text-primary)]">Logs</h2>
        <p className="mt-1 text-base">
            <span className="text-muted">@</span>
            <span className={cn(accountTextClass, 'font-medium lowercase')}>{SAMPLE_UPLOADER}</span>
        </p>
    </HeaderShell>
);

const Variant14PossessiveTitle: React.FC = () => (
    <HeaderShell>
        <h2 className="m-0 text-[2.125rem] font-semibold capitalize text-[var(--color-text-primary)]">
            {displayName}&apos;s Logs
        </h2>
    </HeaderShell>
);

const Variant15NameAboveLogs: React.FC = () => (
    <HeaderShell>
        <p className={cn(accountTextClass, 'm-0 text-lg font-semibold capitalize')}>{displayName}</p>
        <h2 className="m-0 mt-0.5 text-[2.125rem] font-semibold text-[var(--color-text-primary)]">Logs</h2>
    </HeaderShell>
);

const Variant16NameRightInBlock: React.FC = () => (
    <HeaderShell textClassName="flex w-full items-baseline justify-between gap-4">
        <h2 className="m-0 text-[2.125rem] font-semibold text-[var(--color-text-primary)]">Logs</h2>
        <span className={cn(accountTextClass, 'text-lg font-semibold capitalize')}>{displayName}</span>
    </HeaderShell>
);

const Variant17NameOnlyH4: React.FC = () => (
    <HeaderShell>
        <h2 className={cn('m-0 text-[2.125rem] font-semibold capitalize', accountTextClass)}>{displayName}</h2>
    </HeaderShell>
);

const Variant18LogsForName: React.FC = () => (
    <HeaderShell>
        <h2 className="m-0 text-[2.125rem] font-semibold text-[var(--color-text-primary)]">
            Logs for{' '}
            <span className={cn(accountTextClass, 'font-semibold capitalize')}>{displayName}</span>
        </h2>
    </HeaderShell>
);

const Variant19StackedTight: React.FC = () => (
    <HeaderShell>
        <h2 className="m-0 text-[2.125rem] font-semibold leading-tight text-[var(--color-text-primary)]">Logs</h2>
        <p className={cn(accountTextClass, 'm-0 text-lg font-semibold capitalize leading-tight')}>{displayName}</p>
    </HeaderShell>
);

const Variant20StackedBothH4: React.FC = () => (
    <HeaderShell>
        <h2 className="m-0 text-[2.125rem] font-semibold leading-snug text-[var(--color-text-primary)]">Logs</h2>
        <h2 className={cn('m-0 mt-1 text-[2.125rem] font-semibold capitalize leading-snug', accountTextClass)}>
            {displayName}
        </h2>
    </HeaderShell>
);

const VARIANTS: { name: string; Component: React.FC }[] = [
    {name: 'Current — subtitle below', Component: Variant01Current},
    {name: 'Inline with middot', Component: Variant02InlineMiddot},
    {name: 'Inline with colon', Component: Variant03InlineColon},
    {name: 'Same row, name smaller', Component: Variant04InlineNameSmaller},
    {name: 'Same row, name same h4 size', Component: Variant05InlineNameSameSize},
    {name: 'Small “Logs” label, name as hero', Component: Variant06EyebrowLogsNameHero},
    {name: 'Name hero + “Uploaded logs” caption', Component: Variant07NameHeroLogsCaption},
    {name: 'Name hero white + “Logs” caption', Component: Variant08NameHeroWhiteLogsCaption},
    {name: 'Name below, larger (1.25rem)', Component: Variant09NameBelowLarger},
    {name: 'Name below, smaller (0.8125rem)', Component: Variant10NameBelowSmaller},
    {name: 'Name below, bold', Component: Variant11NameBelowBold},
    {name: 'Name below, muted (no account color)', Component: Variant12NameBelowMuted},
    {name: '@username below', Component: Variant13AtUsername},
    {name: 'Possessive single line (“Honorable’s Logs”)', Component: Variant14PossessiveTitle},
    {name: 'Name above “Logs”', Component: Variant15NameAboveLogs},
    {name: '“Logs” left, name right in block', Component: Variant16NameRightInBlock},
    {name: 'Name only (no “Logs” label)', Component: Variant17NameOnlyH4},
    {name: '“Logs for {name}”', Component: Variant18LogsForName},
    {name: 'Stacked tight, no gap', Component: Variant19StackedTight},
    {name: 'Stacked, both h4 size', Component: Variant20StackedBothH4},
];

const CodeInline: React.FC<{ children: React.ReactNode }> = ({children}) => (
    <code className="rounded border border-[var(--color-border-default)] bg-[var(--color-bg-surface-alt)] px-1.5 py-0.5 font-mono text-[0.85em]">
        {children}
    </code>
);

const LogsPageHeaderVariants: React.FC = () => (
    <div className={cn(contentColumnClass, 'mt-2 px-2 pb-6 max-[1279px]:px-1')}>
        <div className="mb-8">
            <h1 className="mb-2 text-[2.125rem] font-semibold text-[var(--color-text-primary)]">
                Logs Page Header Variants
            </h1>
            <p className="max-w-[720px] text-[0.95rem] text-muted">
                20 layouts for username positioning and size on <CodeInline>/logs/:uploaderId</CodeInline>.
                Icon is fixed at 56×56 with standard rounding on every variant. Sample user:{' '}
                <span className={cn(accountTextClass, 'capitalize')}>{displayName}</span>.
                Reply with a variant number to apply it.
            </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {VARIANTS.map(({name, Component}, index) => (
                <VariantFrame key={name} number={index + 1} name={name}>
                    <Component/>
                </VariantFrame>
            ))}
        </div>
    </div>
);

export default LogsPageHeaderVariants;
