'use client'
import { Accordion } from '@base-ui/react/accordion'
import { ChevronDown } from 'lucide-react'

export interface FaqItem {
  q: string
  a: string
}

export interface FaqCategory {
  title: string
  items: FaqItem[]
}

export default function FaqAccordion({ categories }: { categories: FaqCategory[] }) {
  return (
    <div className="space-y-10">
      {categories.map((cat) => (
        <section key={cat.title}>
          <h2 className="text-lg font-semibold mb-4 text-gray-800">{cat.title}</h2>
          <Accordion.Root className="divide-y border rounded-lg overflow-hidden">
            {cat.items.map((item, i) => (
              <Accordion.Item key={i} value={`${cat.title}-${i}`}>
                <Accordion.Header>
                  <Accordion.Trigger className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 [&[data-open]_svg]:rotate-180">
                    {item.q}
                    <ChevronDown className="h-4 w-4 shrink-0 transition-transform" />
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Panel className="px-4 py-3 text-sm text-gray-600 leading-relaxed bg-gray-50 border-t">
                  {item.a}
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </section>
      ))}
    </div>
  )
}
