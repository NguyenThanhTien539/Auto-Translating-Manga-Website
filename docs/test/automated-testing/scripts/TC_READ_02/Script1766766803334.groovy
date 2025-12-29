import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.testobject.ConditionType
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import com.kms.katalon.core.model.FailureHandling
import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject

WebUI.openBrowser('')

WebUI.navigateToUrl('http://54.169.111.98/explore/manga/abcd')

TestObject spinner = new TestObject('spinner')
spinner.addProperty('css', ConditionType.EQUALS,
  'div.animate-spin.rounded-full.h-12.w-12.border-b-2.border-blue-500'
)
WebUI.waitForElementNotPresent(spinner, 10, FailureHandling.OPTIONAL)

WebUI.verifyTextPresent('Manga không tồn tại.', false)

WebUI.closeBrowser()

