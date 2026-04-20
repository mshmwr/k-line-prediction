/**
 * HomeFooterBar — AC-021-FOOTER（K-021 以降為全站共用）
 * Contact info row + GA disclosure.
 *
 * Consumer：HomePage / AppPage / BusinessLogicPage（K-021 擴增）
 * /about 用 <FooterCtaSection />，/diary 本票不插入（K-024 決定）。
 *
 * Mobile 下 px-[72px] 會擠壓窄螢幕，改用 px-6 md:px-[72px] 響應式 padding。
 */
export default function HomeFooterBar() {
  return (
    <footer className="font-mono text-[11px] tracking-[1px] text-muted px-6 md:px-[72px] py-5 border-t border-ink w-full">
      <div className="flex justify-between items-center">
        <span>yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn</span>
      </div>
      <p className="text-center mt-3">
        This site uses Google Analytics to collect anonymous usage data.
      </p>
    </footer>
  )
}
