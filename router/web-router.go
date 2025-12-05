package router

import (
	"embed"
	"net/http"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/controller"
	"github.com/QuantumNous/new-api/middleware"
	"github.com/gin-contrib/gzip"
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
)

func SetWebRouter(router *gin.Engine, buildFS embed.FS, indexPage []byte, newUIIndexPage []byte) {
	router.Use(gzip.Gzip(gzip.DefaultCompression))
	router.Use(middleware.GlobalWebRateLimit())
	router.Use(middleware.Cache())
	router.Use(static.Serve("/", common.EmbedFolder(buildFS, "web2/modelstack-webui/dist")))
	router.NoRoute(func(c *gin.Context) {
		if strings.HasPrefix(c.Request.RequestURI, "/v1") || strings.HasPrefix(c.Request.RequestURI, "/api") {
			controller.RelayNotFound(c)
			return
		}
		// 处理新UI的SPA路由（静态资源已经在 SetNewUIRouter 中处理）
		if strings.HasPrefix(c.Request.RequestURI, "/new-ui") {
			c.Header("Cache-Control", "no-cache")
			c.Data(http.StatusOK, "text/html; charset=utf-8", newUIIndexPage)
			return
		}
		c.Header("Cache-Control", "no-cache")
		c.Data(http.StatusOK, "text/html; charset=utf-8", indexPage)
	})
}

func SetNewUIRouter(router *gin.Engine, newUIFS embed.FS) {
	router.StaticFS("/new-ui", common.EmbedFolder(newUIFS, "web/dist"))
}
