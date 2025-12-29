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

String coverPath = "D:\\test\\cover.jpg"
String zipPath   = "D:\\test\\test.zip"

TestObject coverInput = new TestObject('coverInput')
coverInput.addProperty('xpath', ConditionType.EQUALS, "//input[@type='file' and @name='coverImage']")
WebUI.uploadFile(coverInput, coverPath)

WebUI.setText(findTestObject('Object Repository/Page_/input__mangaTitle'), 'test')

WebUI.setText(findTestObject('Object Repository/Page_/input__mangaAuthor'), 'test')

WebUI.selectOptionByValue(findTestObject('Object Repository/Page_/select_upload_language'), 
    'en', true)

WebUI.click(findTestObject('Object Repository/Page_/label_category1'))

WebUI.click(findTestObject('Object Repository/Page_/span_category2'))

WebUI.executeJavaScript("window.scrollBy(0, 800);", null)

TestObject mangaFileInput = new TestObject('mangaFileInput')
mangaFileInput.addProperty('xpath', ConditionType.EQUALS, "//input[@type='file' and @name='mangaContentFile']")

WebUI.uploadFile(mangaFileInput, zipPath)

WebUI.click(findTestObject('Object Repository/Page_/span_upload_manga'))

WebUI.verifyTextPresent('Vui lòng nhập mô tả truyện', false)

WebUI.closeBrowser()
