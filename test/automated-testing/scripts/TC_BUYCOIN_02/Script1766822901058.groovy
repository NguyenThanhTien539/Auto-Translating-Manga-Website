import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI

WebUI.openBrowser('')

WebUI.navigateToUrl('http://54.169.111.98/order-coin/list')


WebUI.verifyTextPresent('Nóng hổi mới ra lò, không đọc là tiếc đấy!', false)

WebUI.closeBrowser()