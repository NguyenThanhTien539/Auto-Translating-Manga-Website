import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import com.kms.katalon.core.model.FailureHandling as FailureHandling

WebUI.openBrowser('')

WebUI.navigateToUrl('http://54.169.111.98/')

WebUI.click(findTestObject('Object Repository/Page_/button_login'))

WebUI.setText(findTestObject('Object Repository/Page_/input_email'), 'tuphonglien@gmail.com')

WebUI.setEncryptedText(findTestObject('Object Repository/Page_/input_password'), 'T948a+ZOehL+UREGcc/RMQ==')

WebUI.click(findTestObject('Object Repository/Page_/button_ng nhp_1'))

WebUI.click(findTestObject('Object Repository/Page_/svg_add_coin'))

WebUI.click(findTestObject('Object Repository/Page_/p_25.000 VND'))

WebUI.click(findTestObject('Object Repository/Page_/span_payment'))

WebUI.click(findTestObject('Object Repository/Page_/div_zalopay_method'))

WebUI.click(findTestObject('Object Repository/Page_/button_payment_confirm'))
WebUI.waitForPageLoad(30)

WebUI.click(findTestObject('Object Repository/Page_Zalopay Gateway/a_noi_dia_acc'))
WebUI.delay(2)

WebUI.setText(findTestObject('Object Repository/Page_Zalopay Gateway/input_card_number'), '9704540000000062\t')

WebUI.click(findTestObject('Object Repository/Page_Zalopay Gateway/input_card_number'))

WebUI.setText(findTestObject('Object Repository/Page_Zalopay Gateway/input_name'), 'NGUYEN VAN A')

WebUI.setText(findTestObject('Object Repository/Page_Zalopay Gateway/input_release_day'), '10/18')

WebUI.click(findTestObject('Object Repository/Page_Zalopay Gateway/span_Thanh ton'))
WebUI.waitForPageLoad(30)

WebUI.click(findTestObject('Object Repository/Page_Zalopay Gateway/button_continue_payment'))
WebUI.waitForPageLoad(30)

WebUI.setText(findTestObject('Object Repository/Page_Zalopay Gateway/input_card_number'), '111111')

WebUI.click(findTestObject('Object Repository/Page_Zalopay Gateway/span'))
WebUI.waitForPageLoad(30)

String myDomain = "54.169.111.98"
boolean backToSite = false

for (int i = 0; i < 60; i++) {          
    String url = WebUI.getUrl()
    if (url != null && url.contains(myDomain)) {
        backToSite = true
        break
    }
    WebUI.delay(1)
}
WebUI.verifyEqual(backToSite, true, FailureHandling.STOP_ON_FAILURE)

WebUI.waitForPageLoad(30)

WebUI.verifyTextPresent('Thanh toán thành công', false)
WebUI.closeBrowser()

