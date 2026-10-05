import { writeFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'

test('stored AST renders headings, edited components, slots, lists and the managed image', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Edited field guide' })).toBeVisible()
  await expect(page.locator('.field-note[data-tone="urgent"]')).toContainText('Survey 1.')
  await expect(page.locator('.field-note[data-tone="new"]')).toContainText('Inserted component')
  await expect(page.getByRole('listitem').filter({ hasText: 'Record water quality' })).toBeVisible()
  await expect(page.getByRole('img', { name: 'Habitat marker' })).toBeVisible()
  expect(await page.getByRole('img', { name: 'Habitat marker' }).evaluate(image => image instanceof HTMLImageElement && image.complete && image.naturalWidth === 1)).toBe(true)
  expect(errors).toEqual([])
  await page.screenshot({ path: '../evidence/renderer-desktop.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByRole('heading', { name: 'Edited field guide' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ path: '../evidence/renderer-mobile.png', fullPage: true })
  await writeFile('../evidence/browser.json', JSON.stringify({ url: page.url(), errors, text: await page.locator('main').innerText(), mobileOverflow: false }, null, 2))
})
