import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.testobject.ConditionType
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import com.kms.katalon.core.model.FailureHandling
import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject

WebUI.openBrowser('')
WebUI.navigateToUrl('http://54.169.111.98/')

WebUI.click(findTestObject('Object Repository/page01/cover_image01'))
WebUI.click(findTestObject('Object Repository/page01/button_chapter'))
WebUI.click(findTestObject('Object Repository/page01/span_chapter01_manga01'))

TestObject byCss(String name, String css) {
  TestObject to = new TestObject(name)
  to.addProperty('css', ConditionType.EQUALS, css)
  return to
}

boolean waitImgLoaded(String cssSelector, double timeoutSec) {
  int loops = (int) Math.ceil(timeoutSec / 0.2)
  for (int i = 0; i < loops; i++) {
    boolean ok = (boolean) WebUI.executeJavaScript("""
      const img = document.querySelector("${cssSelector}");
      return !!img && img.complete && img.naturalWidth > 0;
    """, null)
    if (ok) return true
    WebUI.delay(0.2)
  }
  return false
}

void scrollToPage(int page) {
  WebUI.executeJavaScript("""
    const el = document.querySelector("div[data-page='${page}']");
    if (el) {
      el.scrollIntoView({ block: "start", behavior: "instant" });
      window.scrollBy(0, -80);
    }
  """, null)
}

void scrollDownOnePage(int page) {
  WebUI.executeJavaScript("""
    const el = document.querySelector("div[data-page='${page}']");
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pageHeight = rect.height;
    const padding = 40;
    window.scrollBy(0, pageHeight + padding);
  """, null)
}

String page1WrapperCss = "div[data-page='1']"
String page1ImgCss = "div[data-page='1'] img"

WebUI.waitForElementPresent(byCss("page1Wrapper", page1WrapperCss), 30)
WebUI.waitForElementPresent(byCss("page1Img", page1ImgCss), 30)
scrollToPage(1)

boolean page1LoadedBeforeRefresh = waitImgLoaded(page1ImgCss, 4.0) 
WebUI.verifyEqual(page1LoadedBeforeRefresh, true, FailureHandling.STOP_ON_FAILURE)

WebUI.refresh()
WebUI.waitForPageLoad(30)

TestObject spinner = new TestObject('spinner')
spinner.addProperty('css', ConditionType.EQUALS,
  'div.animate-spin.rounded-full.h-12.w-12.border-b-2.border-blue-500'
)
WebUI.waitForElementNotPresent(spinner, 30, FailureHandling.OPTIONAL)

WebUI.waitForElementPresent(byCss("page1WrapperAfter", page1WrapperCss), 30)
WebUI.waitForElementPresent(byCss("page1ImgAfter", page1ImgCss), 30)
scrollToPage(1)

boolean page1LoadedAfterRefresh = waitImgLoaded(page1ImgCss, 10.0)
WebUI.verifyEqual(page1LoadedAfterRefresh, true, FailureHandling.STOP_ON_FAILURE)


for (int page = 1; page <= 10; page++) {
  String wrapperCss = "div[data-page='${page}']"
  String imgCss = "${wrapperCss} img"

  WebUI.waitForElementPresent(byCss("page${page}Wrapper", wrapperCss), 10)
  WebUI.waitForElementPresent(byCss("page${page}Img", imgCss), 10)

  scrollToPage(page)

  boolean loaded = waitImgLoaded(imgCss, 2.0)
  WebUI.verifyEqual(loaded, true, FailureHandling.STOP_ON_FAILURE)

  if (page < 10) {
    scrollDownOnePage(page)
    WebUI.delay(0.2)
  }
}

WebUI.closeBrowser()
