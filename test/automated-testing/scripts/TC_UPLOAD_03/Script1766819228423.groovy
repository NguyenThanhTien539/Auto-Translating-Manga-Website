import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.testobject.ConditionType
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI

WebUI.openBrowser('')

WebUI.navigateToUrl('http://54.169.111.98/')

WebUI.click(findTestObject('Object Repository/Page_/button_login'))

WebUI.setText(findTestObject('Object Repository/Page_/input_email'), 'tuphonglien@gmail.com')

WebUI.setEncryptedText(findTestObject('Object Repository/Page_/input_password'), 'T948a+ZOehL+UREGcc/RMQ==')

WebUI.click(findTestObject('Object Repository/Page_/button_ng nhp_1'))

WebUI.click(findTestObject('Object Repository/Page_/span_H s'))

WebUI.click(findTestObject('Object Repository/Page_/button_ng truyn mi'))

WebUI.click(findTestObject('Object Repository/Page_/div_add_new_chap'))

WebUI.selectOptionByValue(findTestObject('Object Repository/Page_/select_handle_jump_manga'), 
    '8', true)

String contentPath = "D:\\test\\cover.jpg"

TestObject contentInput = new TestObject('contentInput')
contentInput.addProperty('xpath', ConditionType.EQUALS, "//input[@type='file' and @name='content_file']")
WebUI.uploadFile(contentInput, contentPath)

WebUI.click(findTestObject('Object Repository/Page_/span_ng Chng Mi'))

WebUI.verifyTextPresent('Chương của bạn đang được xử lý', false)
WebUI.closeBrowser()
