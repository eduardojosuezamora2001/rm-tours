import { describe, expect, it, beforeAll } from 'vitest'
import i18n from '@/i18n'
import { quoteSchema, buildMessage, whatsappUrl } from './model'
import { calendarDate, money, todayDate, validDate } from '@/i18n/format'
import { testTours } from '../../../../shared/testing/tours'
beforeAll(async () => {
  await i18n.loadNamespaces('quote')
})
describe('quotation and calendar dates', () => {
  it('preserves calendar dates independently of timezone', () => {
    expect(validDate('2026-02-30')).toBe(false)
    expect(validDate('2028-02-29')).toBe(true)
    expect(calendarDate('2026-10-15', 'en')).toContain('October 15')
    expect(money(0, 'en')).toContain('0')
  })
  it('validates dates, quantities, consent, contact details and prepares encoded WhatsApp messages', () => {
    const t = i18n.getFixedT('en', 'quote')
    const valid = {
      name: 'Ana & José',
      phone: '+506 8888 0000',
      email: 'example@example.com',
      date: todayDate(),
      adults: 2,
      children: 0,
      nationality: 'Costa Rica',
      schedule: '',
      notes: 'A & B?',
      consent: true,
    }
    expect(quoteSchema(t).safeParse(valid).success).toBe(true)
    for (const invalid of [
      { consent: false },
      { adults: 0 },
      { children: -1 },
      { date: '2020-01-01' },
      { phone: 'abc' },
      { email: 'invalid' },
    ])
      expect(quoteSchema(t).safeParse({ ...valid, ...invalid }).success).toBe(false)
    const message = buildMessage(
      valid,
      testTours[0],
      testTours[0].plans[0],
      'en',
      t,
      'https://rmtours.example',
    )
    expect(message).toContain('Ana & José')
    expect(message).toContain('/en/tours/bioluminiscencia-paquera')
    expect(new URL(whatsappUrl('50688880000', message)!).searchParams.get('text')).toBe(message)
    expect(whatsappUrl('', message)).toBeNull()
    expect(whatsappUrl('javascript:alert(1)', message)).toBeNull()
  })
})
