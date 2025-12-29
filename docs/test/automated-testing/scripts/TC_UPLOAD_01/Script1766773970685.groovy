import static com.kms.katalon.core.checkpoint.CheckpointFactory.findCheckpoint
import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.testobject.ConditionType
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI

import static com.kms.katalon.core.testcase.TestCaseFactory.findTestCase
import static com.kms.katalon.core.testdata.TestDataFactory.findTestData
import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import static com.kms.katalon.core.testobject.ObjectRepository.findWindowsObject
import com.kms.katalon.core.checkpoint.Checkpoint as Checkpoint
import com.kms.katalon.core.cucumber.keyword.CucumberBuiltinKeywords as CucumberKW
import com.kms.katalon.core.mobile.keyword.MobileBuiltInKeywords as Mobile
import com.kms.katalon.core.model.FailureHandling as FailureHandling
import com.kms.katalon.core.testcase.TestCase as TestCase
import com.kms.katalon.core.testdata.TestData as TestData
import com.kms.katalon.core.testng.keyword.TestNGBuiltinKeywords as TestNGKW
import com.kms.katalon.core.testobject.TestObject as TestObject
import com.kms.katalon.core.webservice.keyword.WSBuiltInKeywords as WS
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import com.kms.katalon.core.windows.keyword.WindowsBuiltinKeywords as Windows
import internal.GlobalVariable as GlobalVariable
import org.openqa.selenium.Keys as Keys

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

// input cover
TestObject coverInput = new TestObject('coverInput')
coverInput.addProperty('xpath', ConditionType.EQUALS, "//input[@type='file' and @name='coverImage']")
WebUI.uploadFile(coverInput, coverPath)

WebUI.setText(findTestObject('Object Repository/Page_/input__mangaTitle'), 'test')

WebUI.setText(findTestObject('Object Repository/Page_/input__mangaAuthor'), 'test')

WebUI.selectOptionByValue(findTestObject('Object Repository/Page_/select_upload_language'), 
    'en', true)

WebUI.click(findTestObject('Object Repository/Page_/label_category1'))

WebUI.click(findTestObject('Object Repository/Page_/span_category2'))

//WebUI.click(findTestObject('Object Repository/page_upload/iframe_01'))
TestObject tinyFrame = new TestObject('tinyFrame')
tinyFrame.addProperty('xpath', ConditionType.EQUALS,
  "//iframe[contains(@id,'tiny-react') and contains(@id,'_ifr')]"
)

WebUI.waitForElementPresent(tinyFrame, 20)
WebUI.switchToFrame(tinyFrame, 10)
TestObject tinyBody = new TestObject('tinyBody')
tinyBody.addProperty('css', com.kms.katalon.core.testobject.ConditionType.EQUALS, "body#tinymce")
WebUI.click(tinyBody)
WebUI.setText(tinyBody, 'test')

WebUI.switchToDefaultContent()
WebUI.executeJavaScript("window.scrollBy(0, 800);", null)

// input file manga (zip)
TestObject mangaFileInput = new TestObject('mangaFileInput')
mangaFileInput.addProperty('xpath', ConditionType.EQUALS, "//input[@type='file' and @name='mangaContentFile']")

// Upload
WebUI.uploadFile(mangaFileInput, zipPath)

WebUI.click(findTestObject('Object Repository/Page_/span_upload_manga'))

TestObject spinner = new TestObject('spinner')
spinner.addProperty('css', ConditionType.EQUALS,
  'div.animate-spin.rounded-full.h-12.w-12.border-b-2.border-blue-500'
)
WebUI.waitForElementNotPresent(spinner, 10, FailureHandling.OPTIONAL)

WebUI.verifyTextPresent('Manga của bạn đang được xử lý', false)
WebUI.closeBrowser()
