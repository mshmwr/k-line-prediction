/**
 * HomeFooterBar — AC-HOME-FOOTER
 * Static footer bar for the HomePage.
 * Contact info row + GA disclosure.
 */
export default function HomeFooterBar() {
  return (
    <footer className="font-mono text-[11px] tracking-[1px] text-[#6B5F4E] px-[72px] py-5 border-t border-[#1A1814] w-full">
      <div className="flex justify-between items-center">
        <span>yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn</span>
      </div>
      <p className="text-center mt-3">
        This site uses Google Analytics to collect anonymous usage data.
      </p>
    </footer>
  )
}
