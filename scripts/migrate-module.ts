import fs from 'fs';
import path from 'path';

/**
 * migrate-module.ts
 * Automates the migration of legacy horizontally structured files 
 * into the new Vertical Modular architecture.
 */

const MODULE_ROOT = './src/modules';

async function migrate(moduleName: string, config: {
    controllers?: string[];
    models?: string[];
    services?: string[];
    routes?: string[];
}) {
    const targetDir = path.join(MODULE_ROOT, moduleName);

    console.log(`🚀 Starting migration for module: ${moduleName}`);

    // 1. Create directory structure
    const subDirs = ['controllers', 'models', 'services', 'routes'];
    subDirs.forEach(dir => {
        const p = path.join(targetDir, dir);
        if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
    });

    // 2. Move files
    const allMovedFiles: string[] = [];
    const moveFiles = (files: string[] | undefined, subDir: string) => {
        if (!files) return;
        files.forEach(file => {
            const src = path.resolve(file);
            const fileName = path.basename(file);
            const dest = path.join(targetDir, subDir, fileName);

            if (fs.existsSync(src)) {
                console.log(`📦 Moving ${fileName} to ${subDir}...`);
                fs.renameSync(src, dest);
                allMovedFiles.push(path.join(targetDir, subDir, fileName));
            } else {
                console.warn(`⚠️ Warning: ${file} not found.`);
            }
        });
    };

    moveFiles(config.controllers, 'controllers');
    moveFiles(config.models, 'models');
    moveFiles(config.services, 'services');
    moveFiles(config.routes, 'routes');

    // 3. Automated Import Corrections using Node.js
    console.log(`🔍 Updating imports using @${moduleName} and @shared aliases...`);

    const patterns = [
        { regex: /(['"])(\.\.\/)+models\//g, replacement: `$1@${moduleName}/models/` },
        { regex: /(['"])(\.\.\/)+services\//g, replacement: `$1@${moduleName}/services/` },
        { regex: /(['"])(\.\.\/)+controllers\//g, replacement: `$1@${moduleName}/controllers/` },
        { regex: /(['"])(\.\.\/)+config\//g, replacement: `$1@shared/config/` },
        { regex: /(['"])(\.\.\/)+utils\//g, replacement: `$1@shared/utils/` },
        { regex: /(['"])(\.\.\/)+middlewares\//g, replacement: `$1@shared/middlewares/` },
        { regex: /(['"])(\.\.\/)+validators\//g, replacement: `$1@shared/validators/` },
        { regex: /(['"])(\.\.\/)+helpers\//g, replacement: `$1@shared/helpers/` },
    ];

    const processFiles = (dir: string) => {
        const items = fs.readdirSync(dir);
        items.forEach(item => {
            const fullPath = path.join(dir, item);
            if (fs.statSync(fullPath).isDirectory()) {
                processFiles(fullPath);
            } else if (fullPath.endsWith('.ts')) {
                let content = fs.readFileSync(fullPath, 'utf8');
                let originalContent = content;

                patterns.forEach(p => {
                    content = content.replace(p.regex, p.replacement);
                });

                if (content !== originalContent) {
                    fs.writeFileSync(fullPath, content, 'utf8');
                    console.log(`📝 Updated imports in: ${path.relative('.', fullPath)}`);
                }
            }
        });
    };

    processFiles(targetDir);

    console.log(`✅ Module ${moduleName} structure ready and sanitized.`);
}

/**
 * RUNNER: Edit this section to migrate a new module.
 */
migrate('iam', {
    controllers: [
        'controllers/authController.ts',
        'controllers/googleAuthContorller.ts',
        'controllers/roleController.ts',
        'controllers/userController.ts'
    ],
    models: [
        'models/users.schema.ts',
        'models/roles.schema.ts',
        'models/SessionSchema.ts'
    ],
    routes: [
        'routes/authRoutes.ts',
        'routes/googleAuthRoutes.ts',
        'routes/roleRoutes.ts',
        'routes/user.routes.ts'
    ]
});

console.log("Migration script execution triggered.");
